#!/usr/bin/env bash
echo ">> Enter the new version to release:"
read VERSION
echo ">> Enter the email address of your PGP keys:"
read EMAIL
sha256sum *borderwallets.html > borderwallets.txt
gpg --sign --detach-sign --armor -u $EMAIL ./dist/borderwallets.txt
gpg --verify ./dist/borderwallets.txt.asc
gh release create $VERSION  -F ./dist/notes.md './dist/borderwallets.html#Entropy Grid Generator DOWNLOAD' ./dist/borderwallets.txt ./dist/borderwallets.txt.asc
echo "Done!"
