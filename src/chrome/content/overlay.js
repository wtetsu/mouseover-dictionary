/*
 * Copyright (c) 2006 Ichro Maruta
 * Copyright (c) 2017 wtetsu
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * */

var MouseDictionary = function() {
  this._mDBConn = this.openDb();
  this._lookup_statement = this._mDBConn.createStatement("SELECT * FROM dict WHERE key = ?1");
};

MouseDictionary.prototype.openDb = function() {
  var file = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);
  file.append("mouseoverdictionary.sqlite");
  var storageService = Components.classes["@mozilla.org/storage/service;1"]
                        .getService(Components.interfaces.mozIStorageService);

  var dbConn = storageService.openDatabase(file);
  dbConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS dict (key TEXT PRIMARY KEY,desc TEXT)");
  return dbConn;
};

MouseDictionary.prototype.lookupDb = function(rawkey) {
  var dat;
  var key = rawkey.replace(/\n/gm,' ').replace(/\r/gm,' ');

  try {
    this._lookup_statement.bindUTF8StringParameter(0, key);
    while (this._lookup_statement.executeStep()) {
      dat = this._lookup_statement.getString(1);
    }
  } catch(err) {
    alert(key);
  } finally {
    this._lookup_statement.reset();
  }
  return dat;
};

MouseDictionary.prototype.createDescriptionHtml = function(key, descText) {
  var desc = descText;
  desc = desc.replace(/・[a-zA-Z].+?(\\ |$)/gm, '');
  desc = desc.replace(/◆(.+?)\\ /gm, '<span class="annote">◆$1\\ </span>');
  desc = desc.replace(/【＠】.*$/gm, '');
  desc = desc.replace(/\\ /g, '<br>');

  var ret = '<div class="key">' + key + '</div><div class="desc">' + desc + '</div>';
  return ret;
};

MouseDictionary.prototype.tryWord = function(word) {
  var desc = this.lookupDb(word);
  var doc = null;
  if (desc) {
    doc = this.createDescriptionHtml(word, desc);
  }
  return doc;
};

MouseDictionary.prototype.tryPhrase = function(word) {
  if (word.match(/[^A-Za-z0-9\s]/)) {
    return null;
  }
  var doc = null;
  var desc = this.lookupDb(word);
  if (desc) {
    doc = this.createDescriptionHtml(word, desc);
  }
  return doc;
};

MouseDictionary.prototype.createContent = function(str, range) {
  var descriptions = [];

  var words = md.string.transformWord(str);
  var i, len;
  for (i = 0, len = words.length; i < len; i++) {
    var wordDesc = this.tryWord(words[i]);
    if (wordDesc) {
      descriptions.push(wordDesc);
    }
  }

  var cnt = 0;
  while (md.misc.expandRangeToNextWord(range) && cnt < 5) {
    cnt++;
    str = range.toString();
    var phraseDesc = this.tryPhrase(str);
    if (phraseDesc) {
      descriptions.unshift(phraseDesc);
    }
  }

  var newDocument;
  if (descriptions.length >= 1) {
    newDocument = descriptions.join("<hr/>");
  } else {
    newDocument = '<div class="key">' + str + '</div>';
    newDocument += '<div class="error">No match in dictionary.</div>';
  }
  return newDocument;
};

MouseDictionary.prototype.handlemousemove = function(evt) {
  var klass = Components.classes["@mozilla.org/preferences-service;1"];
  var prefs = klass.getService(Components.interfaces.nsIPrefBranch);
  var sidebar = top.document.getElementById("sidebar");
  var result = sidebar.contentDocument.getElementById("result");

  if (!result) {
    return null;
  }

  var doc = result.contentDocument;

  var parent = evt.rangeParent;
  var str = "";

   if (!parent || parent.nodeType != Node.TEXT_NODE){
     return;
   }

  var range = parent.ownerDocument.createRange();
  range.setStart(evt.rangeParent, evt.rangeOffset);
  range.setEnd(evt.rangeParent, evt.rangeOffset);

  md.misc.expandRangeToWord(range);
  str = range.toString();

  if (this._laststr == str) {
    return;
  } else {
    this._laststr = str;
  }

  //mDBConn.executeSimpleSQL("BEGIN TRANSACTION");

  doc.open();
  doc.write('<style type=text/css>div.key{color:#000088;font-weight:bold;font-size:100%}div.error{color:red;font-weight:bold;}div.desc{font-size:90%;}span.annote{color:green;}span.ex{color:orange;}</style>');
  var fontsize = prefs.getIntPref("extensions.mouseoverdictionary.sidebar_font_size");
  if (fontsize < 0) {
    fontsize = fontsize+"";
  } else {
    fontsize = "+" + fontsize;
  }
  doc.write('<font size=' + fontsize + '>');

  if (!str.match(/[^A-Za-z0-9_\-\s]/)){
    var newDocument = this.createContent(str, range);
    doc.write(newDocument);
  }

  doc.write('</font>');
  doc.close();

  //mDBConn.executeSimpleSQL("COMMIT TRANSACTION");
};

/**
 * the entry point.
 */
function initialize() {
  var mouseDictionary = new MouseDictionary();
  var content = document.getElementById("content");
  content.addEventListener("mousemove", function(evt) {
    mouseDictionary.handlemousemove(evt);
  });
}
