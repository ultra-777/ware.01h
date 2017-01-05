CREATE OR REPLACE FUNCTION "fileSystem"."addFile"(
    IN repositoryName character varying(256),
    IN name character varying(2048),
    IN extension character varying(128),
    IN size bigint)
  RETURNS TABLE(
  	"newFileId" bigint,
  	"newFileExtension" character varying(128),
  	"folderPath" character varying(2048),
  	"isNewFolder" boolean,
  	"repositoryLocation" character varying(2048)) AS
$BODY$
 DECLARE
 v_repository bigint;
 v_maxChildFilesNumber bigint;
 v_maxChildFoldersNumber bigint;
 v_repositoryLocation varchar(2048);
 v_nearestOpenFilesFolder  bigint;
 v_nearestOpenFoldersFolder  bigint;
 v_folderId bigint;
 v_isNewFolder boolean;
 v_newFileId bigint;
 v_folderPath varchar(2048);
BEGIN

	v_repository = (
		select id
		from "fileSystem"."Repository"
		where
		    "isOpen" = true
		    and ((repositoryName is null) or ("Repository"."name" = repositoryName))
		order by id
		limit 1);

	if (v_repository is null) then
	    raise exception 'Not any repository is defined';
	end if;

	v_maxChildFilesNumber = (select "childFilesLimit" from "fileSystem"."Repository" where id = v_repository);
    v_maxChildFoldersNumber = (select "childFoldersLimit" from "fileSystem"."Repository" where id = v_repository);
    v_repositoryLocation = (select "location" from "fileSystem"."Repository" where id = v_repository);

	-- Ensure existence of at least one folder
	if (not exists (select id from "fileSystem"."Folder" limit 1)) then
		insert into "fileSystem"."Folder"
			("repositoryId", "parentId", "parentPath", "created")
		values  
			(v_repository, null, '', current_timestamp);
	end if;

	-- Get bottom level hierarchy
	drop table if exists folders;
	create temp table folders 
		(id bigint, "parentId" bigint, "level" bigint, "path" varchar(2048)) 
	on commit drop;

	insert into folders
		(id, "parentId", "level", "path")
	select 
		source."id",
		source."parentId", 
		source."level",
		source."path"
	from (
		with recursive hierarchy ( "id","parentId", "path", level ) 
		as (
			(
				select 
					fld1."id",
					fld1."parentId", 
					cast (fld1."id" as varchar (50)) as "path", 
					1 
				from 
					"fileSystem"."Folder" fld1
				where 
					fld1."parentId" is null
			)
			union 
			(
				select 
					fld2."id", 
					fld2."parentId",
					--cast ( hierarchy."path" ||'.'||fld2."id" as varchar(50)),
					cast ( fld2."parentPath" || '.' || fld2."id" as varchar(50)) "path", 
					level + 1 
				from 
					"fileSystem"."Folder" fld2
					join hierarchy on( hierarchy."id"=fld2."parentId")
			)      
		)
		select 
			h."id",
			h."parentId", 
			h."path", 
			h.level "level"
		from 
			hierarchy h 
			join (
				select 
					distinct level 
				from 
					hierarchy 
				order by
					level desc
				--limit 2
			) ls on ls.level = h.level
		order by h.level, h."parentId"
	) source;

	-- Nearest folder with open files limit
	v_nearestOpenFilesFolder = 
	(
		select
			fld.id
		from
			folders fld
			left join "fileSystem"."File" c_f on c_f."folderId" = fld.id
		group by
			fld."id"
		having 
			count(c_f.id) < v_maxChildFilesNumber
		limit 1
	);


	if (v_nearestOpenFilesFolder is null) then
		v_nearestOpenFoldersFolder = 
		(
			select
				fld.id
			from
				folders fld
				left join "fileSystem"."Folder" c_fld on c_fld."parentId" = fld.id
			group by
				fld."id"
			having 
				count(c_fld.id) < v_maxChildFoldersNumber
			order by 
				fld.id
			limit 1
		);

		v_folderPath = 
			(select "path" 
			from folders 
			where id = v_nearestOpenFoldersFolder
			limit 1);

		if (v_nearestOpenFoldersFolder is not null) then
		insert into "fileSystem"."Folder"
			("repositoryId", "parentId", "parentPath", "created")
		values  
			(v_repository, v_nearestOpenFoldersFolder, v_folderPath, current_timestamp)
		returning id into v_folderId;
		v_folderPath = v_folderPath || '.' || cast(v_folderId as varchar(50));
		end if;
		v_isNewFolder = true;
	else
		v_folderId = v_nearestOpenFilesFolder;

		v_folderPath = 
			(select "path" 
			from folders 
			where id = v_nearestOpenFilesFolder
			limit 1);
			
		v_isNewFolder = false;
	end if;

	insert into 
		"fileSystem"."File" (
			"name"
			,"extension"
			,"folderId"
			,"folderPath"
			,"repositoryId"
			,"size"
			,"created"
		) 
	values (
		name
		,extension
		,v_folderId
		,v_folderPath
		,v_repository
		,size
		,current_timestamp
	)
	returning id into v_newFileId;
	return
		query
			select
				v_newFileId,
				extension,
				v_folderPath,
				v_isNewFolder,
				v_repositoryLocation;
 END
 
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100
  ROWS 1000;

