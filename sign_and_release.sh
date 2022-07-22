#!/usr/bin/env bash
echo ">> Enter the new version to release:"
read VERSION
echo ">> Enter the email address of your PGP keys:"
read EMAIL
sha256sum ./dist/borderwallets.html > ./releases/borderwallets.txt
gpg --sign --detach-sign --armor -u $EMAIL ./releases/borderwallets.txt
gpg --verify ./releases/borderwallets.txt.asc
gh release create $VERSION  -F ./releases/notes.md './dist/borderwallets.html#Entropy Grid Generator DOWNLOAD' ./releases/borderwallets.txt ./releases/borderwallets.txt.asc
echo "Done!"
