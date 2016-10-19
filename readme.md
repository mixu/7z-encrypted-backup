# 7z-encrypted-backup

Create encrypted backups for cloud storage using 7z as the container format - stores file metadata as JSON in separate 7z archives for easier file management.

# Features

With cloud storage becoming cheaper and cheaper, owning and operating hard drives to keep redundant backups seems outdated. I wanted a tool that:

- uses openly available software (7zip) and formats (newline-separated JSON)
- produces reasonably secure files (7z uses AES-256) with password protection
- encrypts filenames to avoid leaking information about the content
- produces separate metadata files so that I don't need to download any of the archive files just to peek at what they contain
- batches up really small files (to avoid having a ton of tiny files) and breaks up really large files (to avoid deal with failed uploads as frequently)

# TODO

- when given a target path, use paths relative to the root of the path in the tarfile
- parse the split size so that the target archive sizes are also affected

# Installation

```
npm install -g 7zeb
```

# Usage

```
7zeb -p password -o ./output --root /some/path --split 512m ./foo ./bar
```

`7zeb` will iterate over the files in `./foo` and `./bar` and writes output into `./output`.

The actual files and the metadata file are encrypted using AES-256 in 7z containers. No compression is applied because I mostly want to encrypt media files which don't really compress well anyway.

`./output/meta.7z` contains the metadata for all the files as a single `meta.json` file. This currently consists of the original full file path of the file and the content of `fs.stat` (e.g file size, ctime etc.) for each file.

The actual files are stored under `./output/[a-z][a-z]/(random string).7z`. The first two characters of the random string are used to avoid having too many files in a single folder for large backups.

When generating 7z archives for the content, `7zeb` attempts to create archives that are `512` megabytes in size. This feels like a reasonable midpoint - for small files it's not too much overhead when wanting to restore, and for large files its not too many files per large file.

- For small files, it will try to take a whole folder of files - or a whole subtree of files - until it reaches about this size. If a single folder is too large, it simply sort the folder alphabetically and then create archives of ~`512` mb each.
- For large files, it will use 7zip's ability to split archives into multiple files to create files of ~`512` mb each.

Each archive is created with its own invocation of `7z` - this means that each archive is independent of all the other archives and can be individually downloaded and un7zipped.
