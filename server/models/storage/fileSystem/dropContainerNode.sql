CREATE OR REPLACE FUNCTION "fileSystem"."dropContainerNode"(IN targetNodeId bigint)
  RETURNS TABLE("fileId" bigint, "extension" character varying (128), "folderPath" character varying(2048), "repositoryLocation" character varying (2048)) AS
$BODY$
 DECLARE
 v_record record;
BEGIN

	drop table if exists descendants;
	create temp table descendants 
		(
			id bigint,
			"parentId" bigint, 
			"level" bigint,
			"name" varchar(1024),
			"isContainer" boolean,
			"fileId" bigint,
			"extension" varchar(128),
			"folderPath" varchar(2048),
			"repositoryLocation" varchar(2048)
		) 
	on commit drop;

	insert into
		descendants ("id","parentId", "level","name","isContainer","fileId","extension","folderPath","repositoryLocation")
	(

		with recursive hierarchy ( "id","parentId", "name", "isContainer", "fileId", "path", level ) 
			as (
				(
					select 
						root."id",
						root."parentId", 
						root."name",
						root."isContainer",
						root."fileId",
						cast (root."id" as varchar (50)) as "path", 
						1 
					from 
						"fileSystem"."Node" root
					where 
						root."id" = targetNodeId
				)
				union 
				(
					select 
						descendant."id", 
						descendant."parentId",
						descendant."name",
						descendant."isContainer",
						descendant."fileId",
						--cast ( hierarchy."path" ||'.'||fld2."id" as varchar(50)),
						cast ( hierarchy."path" || '.' || descendant."id" as varchar(50)) "path", 
						level + 1 
					from 
						"fileSystem"."Node" descendant
						join hierarchy on( hierarchy."id"=descendant."parentId")
				)      
			)
			select 
				h."id",
				h."parentId", 
				h.level "level",
				h."name",
				h."isContainer",
				h."fileId",
				f."extension",
				f."folderPath",
				r."location"
			from 
				hierarchy h 
				left join "fileSystem"."File" f on f.id = h."fileId"
				left join "fileSystem"."Repository" r on r.id = f."repositoryId"
			order by 
				h.level desc, 
				h."isContainer" asc,
				h."parentId"
	);


	FOR v_record IN SELECT d.id, d."fileId" from descendants d
	LOOP
		delete from "fileSystem"."Blob" b where (b."containerNodeId" = v_record."id") or (b."fileId" = v_record."fileId");
		delete from "fileSystem"."Node" n WHERE n.id = v_record."id";
		delete from "fileSystem"."File" f WHERE f.id = v_record."fileId";
	END LOOP;


	return 
		query 
			select 
				d."fileId",
				d."extension",
				d."folderPath", 
				d."repositoryLocation" 
			from 
				descendants d
			where
				d."fileId" is not null
			order by
				d."level" desc;
 END
 
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100
  ROWS 1000;