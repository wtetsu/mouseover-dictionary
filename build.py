# -*- coding: utf-8 -*-
#
# Copyright (C) 2017 wtetsu
# License: MIT

import os
import sys
import subprocess

def command(cmd):
  r = subprocess.call(cmd, shell=True)
  if r != 0:
    raise Exception("command error: " + cmd)
  return r

def build(version):
  xpifile = "mouseoverdictionary-%s.xpi" % (version)
  if os.path.isfile(xpifile):
    os.remove(xpifile)
  os.chdir("src")
  command("zip -r ../%s *" % (xpifile))

if __name__ == "__main__":
  version = None
  if len(sys.argv) > 1:
    version = sys.argv[1]
  else:
    version = "unstable"
  build(version)
