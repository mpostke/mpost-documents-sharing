ssh -i ~/Downloads/document_sharing_keypair.pem ubuntu@3.248.195.189

if not work
    chmod 600 ~/Downloads/document_sharing_keypair.pem

ls
cd projectname
git pull
cd ..
./server-script.sh

HUrrah!