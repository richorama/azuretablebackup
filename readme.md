# Azure Table Backup

A command line utility to backup and restore Windows Azure Table Storage.

## Installation

You must have Node.js installed first.

```
$ npm install azuretablebackup -g
```

## Usage

Examples of usage:

```
// backup the foo table
$ azuretablebackup -a backup -n mystorageaccount -k xxx -t foo

// restore the foo table
$ azuretablebackup -a restore -n mystorageaccount -k xxx -t foo

// restore the foo backup to a new table
$ azuretablebackup -a restore -n mystorageaccount -k xxx -t foo2 -f foo.json

// list all available tables
$ azuretablebackup -a list -n mystorageaccount -k xxx 
```

Arguments:
```
--action, -a    The action to perform (backup / restore / list), required
--name, -n      The name of the Windows Azure Storage Account, required
--key, -k       The key of the Windows Azure Storage Account, required
--table, -t     The table in Windows Azure Storage to back up
--file, -f      Filename to use as backup or restore (defaults to the table name)
```

## License

MIT