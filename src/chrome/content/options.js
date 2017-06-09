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

var mDBConn;
var num_of_record;

function open_db() {
  file = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);
  file.append("mouseoverdictionary.sqlite");
  var storageService = Components.classes["@mozilla.org/storage/service;1"]
                        .getService(Components.interfaces.mozIStorageService);
  mDBConn = storageService.openDatabase(file);
  mDBConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS dict (key TEXT PRIMARY KEY, desc TEXT)");
}


function initialize() {
  open_db();
  var stat = document.getElementById('stat');

  num_of_record = 0;
  mDBConn.executeSimpleSQL("BEGIN TRANSACTION");
  var count_statement= mDBConn.createStatement("SELECT COUNT(*) FROM dict");
  try {
    while (count_statement.executeStep()) {
      num_of_record += count_statement.getInt32(0);
    }
  } finally {
    count_statement.reset();
  }
  mDBConn.executeSimpleSQL("END TRANSACTION");

  if (num_of_record === 0) {
    stat.value="[辞書のロード]をクリックして、検索の対象となる辞書データを登録してください。\n";
  } else {
    stat.value  = file.target + "\n" +
                  "上記ファイルに、" + num_of_record + "項目が登録されています。\n" +
                  "再ロード時には既存データは全て削除されます。";
  }
}

var file;
var fp;
var stream,is;
var statement;
var cnt=0;
var stat_prev="";

var _stat = null;
var _separator = null;
var _fileFormat = null;

var _startTime;

function finish() {
  statement.reset();
  is.close();
  stream.close();
  mDBConn.executeSimpleSQL("END TRANSACTION");

  var ms = (new Date()).getTime() -_startTime.getTime();
  alert("辞書データの登録が完了しました(" + ms.toString() + "ms)");

  window.close();
}

function dict_loader() {
  try {
    var i;
    var data = {};
    var englishWord;
    var key;
    var lastKey = null;
    var descriptionLines = [];
    for (i = 0; i < 1000; i++) {
      var r = is.readLine(data);
      var line = data.value;
      if (line) {
        key = null;
        val = null;
        if (_fileFormat === "PDIC") {
          if (i % 2 === 0) {
            englishWord = line;
          } else {
            key = englishWord;
            val = line;
          }
        } else if (_fileFormat === "EIJI") {
          var index = line.indexOf(":");
          if (index > 0) {
            key = line.substring(1, index-1).replace(/\{.*\}/, "").trim();
            val = line.substring(index+1);
          }
        } else if (_separator) {
          var temp = line.split(_separator);
          if (temp.length >= 2) {
            key = temp[0];
            val = temp[1];
          }
        }
        if (key && val) {
          if (lastKey === null || key === lastKey) {
          } else {
            if (lastKey && descriptionLines.length >= 1) {
              statement.bindUTF8StringParameter(0, lastKey);
              statement.bindUTF8StringParameter(1, descriptionLines.join("\n"));
              statement.execute();
              descriptionLines.length = 0;
            }
          }
          descriptionLines.push(val);
          lastKey = key;
        }
      }
      if (!r) {
        finish();
        break;
      }
    }

    if (lastKey && descriptionLines.length >= 1) {
      statement.bindUTF8StringParameter(0, lastKey);
      statement.bindUTF8StringParameter(1, descriptionLines.join("\n"));
      statement.execute();
      descriptionLines.length = 0;
    }

    cnt += 1000;
    _stat.value = stat_prev + cnt + "個のデータを登録しました．";
    setTimeout(dict_loader, 0);
  } catch (ex) {
    alert(ex.toString());
    finish();
  }
}

function loaddic() {
  _stat = document.getElementById('stat');
  _fileFormat = document.getElementById('fileformat').value;
  switch (_fileFormat) {
    case "PDIC":
      _separator = null;
      break;
    case "PDIC_LINE":
      _separator = " /// ";
      break;
    case "TSV":
      _separator = "\t";
      break;
    case "EIJI":
      _separator = null;
      break;
  }

  var encoding = document.getElementById('encoding').value;

  var nsIFilePicker = Components.interfaces.nsIFilePicker;
    fp = Components.classes["@mozilla.org/filepicker;1"]
            .createInstance(Components.interfaces.nsIFilePicker);
  fp.init(window, "辞書ファイルの選択", nsIFilePicker.modeOpen);
  fp.appendFilter("辞書データ","*.txt");
  var res=fp.show();
  if (res==nsIFilePicker.returnOK){
      var aFile=fp.file;
      stream = Components.classes['@mozilla.org/network/file-input-stream;1']
            .createInstance(Components.interfaces.nsIFileInputStream);
    stream.init(aFile, 1, 0, false); // open as "read only"

    is = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
                       .createInstance(Components.interfaces.nsIConverterInputStream);

    is.init(stream, encoding, 1024, 0xFFFD);
     _stat.value="辞書ファイルを開きました．\n";
    mDBConn.executeSimpleSQL("BEGIN TRANSACTION");
//    mDBConn.executeSimpleSQL("DROP TABLE IF EXISTS dict");

    _startTime = new Date();
     _stat.value+="登録を開始します．\n";
    stat_prev=_stat.value;
    var loadbtn=document.getElementById('load');
    loadbtn.disabled=true;
    mDBConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS dict (key TEXT PRIMARY KEY,desc TEXT)");
    mDBConn.executeSimpleSQL("DELETE FROM dict");

    statement = mDBConn.createStatement("INSERT OR IGNORE INTO dict VALUES (?1,?2)");

    if (is instanceof Components.interfaces.nsIUnicharLineInputStream) {
      setTimeout(dict_loader, 10);
    }
  }
}
