#!/usr/bin/env bash
echo ">> Enter the new version to release:"
read VERSION
echo ">> Enter the email address of your PGP keys:"
read EMAIL
sha256sum borderwallets.html > borderwallets.txt
gpg --sign --detach-sign --armor -u $EMAIL borderwallets.txt
gpg --verify borderwallets.txt.asc
gh release create $VERSION  -F ./notes.md './borderwallets.html#Entropy Grid Generator DOWNLOAD' ./borderwallets.txt ./borderwallets.txt.asc
echo "Done!"
