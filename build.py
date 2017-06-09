import os
import shutil
import sys
import subprocess

version = None

if len(sys.argv) > 1:
  version = sys.argv[1]
else:
  version = "unstable"

def command(cmd):
  r = subprocess.call(cmd, shell=True)
  if r != 0:
    raise Exception("command error: " + cmd)
  return r

if os.path.isdir("build"):
  shutil.rmtree("build")

shutil.copytree("src", "build")

os.chdir("build/chrome/mouseoverdictionary")
command("jar -cvf ../mouseoverdictionary.jar *")

os.chdir("../")
shutil.rmtree("mouseoverdictionary")

os.chdir("../")
command("zip -r ../mouseoverdictionary-%s.xpi *" % (version))
