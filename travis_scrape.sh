eval "$(ssh-agent -s)"
echo $GIT_PRIVATE_KEY | base64 --decode > ~/deploy_key
chmod 600 ~/deploy_key
ssh-add ~/deploy_key
git checkout -b gh-pages
node main.js; 
git merge master
git config --global user.email "ryanhughes624+gitbot@gmail.com"
git config --global user.name "data-updater-bot"
git commit -a -m "test commit!"
git remote add deploy git@github.com:ryanhugh/NEU-employee-directory.git
git config --global push.default simple
git push git@github.com:ryanhugh/NEU-employee-directory.git gh-pages
echo hi
