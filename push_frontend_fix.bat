@echo off
echo ==========================================
echo  Pushing Frontend to GitHub
echo ==========================================

echo Initializing Git...
git init

echo Adding files...
git add .

echo Committing...
git commit -m "Update frontend with fixes"

echo Renaming branch to main...
git branch -M main

echo Adding remote origin...
git remote add origin https://github.com/my-galaxie/frontend-smartLibrary.git

echo Pushing to GitHub...
echo (You may be prompted for your GitHub credentials)
git push -u origin main

echo ==========================================
echo  Done!
echo ==========================================
pause
