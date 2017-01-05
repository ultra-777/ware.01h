
insert into "security"."Role" ("name")
select 'user'
where not exists (select null from "security"."Role" where "name" = 'user');

insert into "security"."Role" ("name")
select 'admin'
where not exists (select null from "security"."Role" where "name" = 'admin');


