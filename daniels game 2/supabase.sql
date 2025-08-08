
create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  role text check (role in ('admin','player')) default 'player',
  discord_id text
);

create table if not exists scores (
  user_id uuid primary key references profiles(id) on delete cascade,
  score integer not null default 0
);
create table if not exists coins (
  user_id uuid primary key references profiles(id) on delete cascade,
  balance integer not null default 0
);

create table if not exists items (
  id serial primary key,
  name text not null,
  emoji text not null,
  price integer not null,
  daily_stock integer not null default 1,
  duration_hours integer,
  stack_limit integer default 2,
  description text
);

create table if not exists shop_inventory (
  shop_date date not null,
  item_id integer references items(id) on delete cascade,
  qty_left integer not null,
  primary key (shop_date, item_id)
);

create table if not exists user_items (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade,
  item_id integer references items(id),
  acquired_at timestamptz default now(),
  expires_at timestamptz,
  qty integer not null default 1
);

create or replace view user_items_view as
  select ui.*, i.name, i.emoji from user_items ui
  join items i on i.id = ui.item_id;

create or replace function public_leaderboard()
returns table (user_id uuid, username text, score int, coins int)
language sql stable as $$
  select p.id, coalesce(p.username,'Player') as username,
         coalesce(s.score,0) as score, coalesce(c.balance,0) as coins
  from profiles p
  left join scores s on s.user_id = p.id
  left join coins c on c.user_id = p.id
  order by coalesce(s.score,0) desc, coalesce(c.balance,0) desc;
$$;

create or replace function today_shop()
returns table (item_id int, name text, emoji text, price int, qty_left int)
language sql stable as $$
  select i.id, i.name, i.emoji, i.price, si.qty_left
  from items i
  join shop_inventory si on si.item_id = i.id and si.shop_date = current_date
  order by i.name;
$$;

create or replace function refresh_shop_today()
returns void language plpgsql security definer as $$
begin
  if (select role from profiles where id = auth.uid()) <> 'admin' then
    raise exception 'Only admin can refresh shop';
  end if;
  delete from shop_inventory where shop_date = current_date;
  insert into shop_inventory (shop_date, item_id, qty_left)
  select current_date, id, daily_stock
  from items
  order by random()
  limit 10;
end; $$;

create or replace function purchase_item(p_user_id uuid, p_item_id int)
returns void language plpgsql security definer as $$
declare
  price int;
  stock_left int;
  inv_count int;
  bal int;
  dur int;
  stk int;
  owned int;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  select i.price, coalesce(si.qty_left,0), i.duration_hours, i.stack_limit
    into price, stock_left, dur, stk
  from items i
  left join shop_inventory si on si.item_id = i.id and si.shop_date = current_date
  where i.id = p_item_id;

  if stock_left is null then
    raise exception 'This item is not in today''s shop';
  end if;
  if stock_left <= 0 then
    raise exception 'Out of stock for today';
  end if;

  select balance into bal from coins where user_id = p_user_id;
  if bal is null then bal := 0; end if;
  if bal < price then
    raise exception 'Not enough coins';
  end if;

  select coalesce(sum(qty),0) into inv_count from user_items where user_id = p_user_id;
  if inv_count >= 5 then
    raise exception 'Inventory full (max 5). Trash an item first.';
  end if;

  select coalesce(sum(qty),0) into owned from user_items where user_id = p_user_id and item_id = p_item_id;
  if owned >= coalesce(stk, 99) then
    raise exception 'You already own the max allowed for this item.';
  end if;

  update coins set balance = balance - price where user_id = p_user_id;
  update shop_inventory set qty_left = qty_left - 1 where shop_date = current_date and item_id = p_item_id;

  insert into user_items (user_id, item_id, expires_at, qty)
  values (p_user_id, p_item_id, case when dur is not null then now() + (dur || ' hours')::interval else null end, 1);
end; $$;

create or replace function admin_adjust_score(p_target_user_id uuid, p_delta int)
returns void language plpgsql security definer as $$
begin
  if (select role from profiles where id = auth.uid()) <> 'admin' then
    raise exception 'Only admin';
  end if;
  insert into scores(user_id, score) values (p_target_user_id, 0)
  on conflict (user_id) do nothing;
  update scores set score = greatest(0, score + p_delta) where user_id = p_target_user_id;
end; $$;

create or replace function admin_adjust_coins(p_target_user_id uuid, p_delta int)
returns void language plpgsql security definer as $$
begin
  if (select role from profiles where id = auth.uid()) <> 'admin' then
    raise exception 'Only admin';
  end if;
  insert into coins(user_id, balance) values (p_target_user_id, 0)
  on conflict (user_id) do nothing;
  update coins set balance = greatest(0, balance + p_delta) where user_id = p_target_user_id;
end; $$;

alter table profiles enable row level security;
alter table scores enable row level security;
alter table coins enable row level security;
alter table items enable row level security;
alter table shop_inventory enable row level security;
alter table user_items enable row level security;

create policy "read profiles" on profiles for select using (true);
create policy "update own profile" on profiles for update using (auth.uid() = id);

create policy "read scores" on scores for select using (true);
create policy "admin upserts scores" on scores for insert with check ((select role from profiles where id = auth.uid()) = 'admin');
create policy "admin updates scores" on scores for update using ((select role from profiles where id = auth.uid()) = 'admin');

create policy "read coins" on coins for select using (auth.uid() = user_id);
create policy "admin upserts coins" on coins for insert with check ((select role from profiles where id = auth.uid()) = 'admin');
create policy "admin updates coins" on coins for update using ((select role from profiles where id = auth.uid()) = 'admin');

create policy "read items" on items for select using (true);
create policy "read shop" on shop_inventory for select using (true);

create policy "read own items" on user_items for select using (auth.uid() = user_id);
create policy "trash own items" on user_items for delete using (auth.uid() = user_id);
create policy "no direct insert" on user_items for insert with check (false);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, avatar_url, role, discord_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'user_name', new.email),
          new.raw_user_meta_data->>'avatar_url',
          case when new.raw_user_meta_data->>'provider_id' = current_setting('app.admin_discord_id', true) then 'admin' else 'player' end,
          new.raw_user_meta_data->>'provider_id')
  on conflict (id) do nothing;

  insert into public.scores (user_id, score) values (new.id, 0) on conflict (user_id) do nothing;
  insert into public.coins (user_id, balance) values (new.id, 0) on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

insert into items (name, emoji, price, daily_stock, duration_hours, stack_limit, description) values
('TOTAL WAR', '⚔️', 125, 1, null, 1, 'Steal half of a player''s points.'),
('DOUBLER', '🌀', 50, 1, 48, 1, 'Double points for 48h.'),
('IMMUNITY', '🛡️', 40, 2, 24, 2, 'Protects against attacks for 24h.'),
('COPYCAT', '🐒', 25, 2, 48, 2, 'Copy actions of another player for 48h.'),
('ALLIANCE', '🤝', 15, 1, 48, 1, 'Share points with a partner for 48h.'),
('SLEEPING PILL', '💤', 15, 1, 24, 1, 'Silence a player for 24h.'),
('POISON', '☠️', 15, 2, null, 2, 'Escalating penalties until first-place reply.'),
('WOUND', '💥', 0, 3, null, 3, 'Spend coins to remove half in points.'),
('SHIELD', '🛡️✨', 20, 2, null, 1, 'Reduce any point reductions by half, 3 attacks.'),
('REVEALER', '🔎', 40, 1, null, 1, 'Privately view a player''s inventory.'),
('ROLLBACK', '↩️', 75, 1, null, 1, 'Revert score to last update.'),
('GOLD RUSH', '⚜️', 100, 1, 48, 1, 'Earn 10 coins per reply for 48h.'),
('THIEVES TOOLS', '🔓', 50, 1, null, 1, 'Steal one item from a player.'),
('DOUBLE DAMAGE', '💢', 50, 2, 48, 2, 'All damage dealt is doubled for 48h.'),
('BARGAIN HUNTER', '💰', 50, 1, 24, 1, 'All shop items half price for you for 24h.'),
('FRIENDSHIP BRACELET', '📿', 15, 1, null, 1, 'Earn points regardless of greeting; imposters give points.');
