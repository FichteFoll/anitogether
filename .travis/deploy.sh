#!/usr/bin/env bash

set -ev # show commands run and terminate on non-zero exit code

if [ $TRAVIS_BRANCH != master ]; then
  exit 0
fi

# create commit of docs/html folder
pushd dist
touch .nojekyll # disable jekyll
git init
git add .
git -c user.name='Deployment Bot' -c user.email='deploy@travis-ci.org' commit -m "Auto-deploy of $TRAVIS_COMMIT"
popd

# load ssh key
openssl aes-256-cbc -K $encrypted_b458c7956a65_key -iv $encrypted_b458c7956a65_iv -in .travis/id_deploy.enc -out .travis/id_deploy -d
chmod 600 .travis/id_deploy
eval $(ssh-agent -s)
ssh-add .travis/id_deploy

# push to gh-pages branch
cd dist
git push -f -q "ssh://git@github.com/$TRAVIS_REPO_SLUG.git" HEAD:gh-pages
