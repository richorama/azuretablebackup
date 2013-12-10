var azure = require('azure');
var Lazy = require('lazy');
var fs = require('fs');
var args = require('args');

var options = args.Options.parse([
    {
        name: 'action',
        shortName: 'a',
        required: true,
        help: 'The action to perform (backup / restore / list)'
    },
    {
        name: 'name',
        shortName: 'n',
        required: true,
        help: 'The name of the Windows Azure Storage Account'
    },
    {
        name: 'key',
        shortName: 'k',
        required: true,
        help: 'The key of the Windows Azure Storage Account'
    },
    {
        name: 'table',
        shortName: 't',
        help: 'The table in Windows Azure Storage to back up'
    },
    {
        name: 'file',
        shortName: 'f',
        help: 'Filename to use as backup or restore (defaults to the table name)'
    },
]);


var parsed;
try {
    parsed = args.parser(process.argv).parse(options);
}
catch (err) {
    console.log(options.getHelp());
    process.exit();
}

var tableService = azure.createTableService(parsed.name, parsed.key);

switch (parsed.action){
    case "backup":
        if (!parsed.table){
            console.log("use must supply a table name");
            break;
        }
        backupEntities(parsed.table, parsed.file || parsed.table + ".json");
        break;
    case "restore":
        if (!parsed.table){
            console.log("use must supply a table name");
            break;
        }
        restoreEntities(parsed.table, parsed.file || parsed.table + ".json");
        break;
    case "list":
        listTables();
        break;
    default:
        console.log("action not recognised, please supply one of (backup / restore / list)");     
}

function listTables(){
    console.log("querying tables\n");
    tableService.queryTables(function(err, tables){
        if (err){
            console.log(err);
        }    
        tables.forEach(function(x){
            console.log(x.TableName);    
        });
    });    
}
var counter = 0;
function queryEntities(table, cb, finished) {
    counter = 0;
    console.log("downloading entities\n");

    var query = azure.TableQuery
        .select()
        .from(table);

    tableService.queryEntities(query, function(error, entities, continuationToken){
        if (error){
            console.log(error);
        } else {
            counter += entities.length;
            entities.forEach(cb);
            if (continuationToken.nextPartitionKey) {
                pageResults(continuationToken, cb, finished);    
            } else {
                if (finished){
                    finished();
                }
            }
        }
    });
}

function pageResults(continuationToken, cb, finished){
    continuationToken.getNextPage(function(error, results, newContinuationToken){
        if (error){
            console.log(error);
        } else {
            counter += entities.length;
            entities.forEach(cb);
            if (newContinuationToken.nextPartitionKey){
                pageResults(newContinuationToken, cb);
            } else {
                if (finished){
                    finished();
                }    
            }
        }
    });
}


function backupEntities(table, filename){
    var stream = fs.createWriteStream(filename)
    queryEntities(table, function(x){
        delete x._;
        stream.write(JSON.stringify(x) + "\n");
    }, function(){
        stream.end();
        console.log("saved " + counter + " entities");
    });
}


function restoreEntities(table, filename){
    var count = 0;
    tableService.createTableIfNotExists(table, function(error){
        if (error){
            console.log(error);
        } else {
            var lazy = new Lazy(fs.createReadStream(filename));
            
            lazy.on('end', function() { console.log("uploaded " + count + " entities"); })
                .lines
                .forEach(function(line){
                    count += 1;
                    var json = JSON.parse(line.toString());
                    tableService.insertOrReplaceEntity(table, json, function(err){
                        if(err){
                            console.log(err);
                        } 
                    });
                });
            
        }
    });
}
