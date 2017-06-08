/*
 * Copyright (c) 2006 Ichro Maruta
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

function open_db()
{
	file = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);
	file.append("mouseoverdictionary.sqlite");
	var storageService = Components.classes["@mozilla.org/storage/service;1"]
                        .getService(Components.interfaces.mozIStorageService);
    mDBConn = storageService.openDatabase(file);
	mDBConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS dict (key TEXT PRIMARY KEY,desc TEXT)");
}


function initialize()
{
	open_db();
	var stat=document.getElementById('stat');


	num_of_record=0;
	mDBConn.executeSimpleSQL("BEGIN TRANSACTION");
	var count_statement= mDBConn.createStatement("SELECT COUNT(*) FROM dict");
	try{
		while (count_statement.executeStep()) {
		  num_of_record += count_statement.getInt32(0);
		}
	}finally{
		count_statement.reset();
	}
	mDBConn.executeSimpleSQL("END TRANSACTION");

	if(num_of_record==0){
		stat.value="[辞書のロード]をクリックして，検索の対象となる辞書データを登録してください．\n"
		+"使用可能なデータはPDICの一行テキスト形式です．\n"
		+"英辞郎のデータを用いる場合，事前にPDICを用いてデータの形式を変換してください．\n"
		+"登録には数分を要することがあります．経過はここに表示されます．\n";
	}else{
		stat.value  = "現在のデータ数："+num_of_record+"項目\n"
					+ "辞書を変更する場合，いったんFirefoxを完全に閉じて，\n"
					+ file.target+"\n"
					+ "を削除してから，再度この画面で登録を行ってください．";
		var loadbtn=document.getElementById('load');
		loadbtn.disabled=true;
	}	
}

var file;
var fp;
var stream,is;
var statement;
var cnt=0;
var stat_prev="";

function dict_loader()
{
	var i;
	var key="";
	var desc="";
	var line = {};
	var temp = [];
	var stat=document.getElementById('stat');
 
	for(i=0;i<1000;i++)
	{
		if(!is.readLine(line)){
			statement.reset();
			is.close();
			stream.close();
			mDBConn.executeSimpleSQL("END TRANSACTION");
			alert('辞書データの登録が完了しました．');
			window.close();
			return;
		}
		temp=line.value.split(" /// ");
		statement.bindUTF8StringParameter(0, temp[0]);
		statement.bindUTF8StringParameter(1, temp[1]);
		statement.execute();
	}
	cnt+=1000;
	stat.value=stat_prev+cnt+"個のデータを登録しました．";
	setTimeout('dict_loader();',1);
	return;
}

function loaddic()
{
	var stat=document.getElementById('stat');
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
    fp = Components.classes["@mozilla.org/filepicker;1"]
       		 .createInstance(Components.interfaces.nsIFilePicker);
	fp.init(window, "辞書ファイルの選択", nsIFilePicker.modeOpen);
	fp.appendFilter("PDIC１行テキスト形式","*.txt");
	var res=fp.show();
	if (res==nsIFilePicker.returnOK){
  		var aFile=fp.file;
  		stream = Components.classes['@mozilla.org/network/file-input-stream;1']
  					.createInstance(Components.interfaces.nsIFileInputStream);
		stream.init(aFile, 1, 0, false); // open as "read only"
	
		var charset = "UTF-16";
		is = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
		                   .createInstance(Components.interfaces.nsIConverterInputStream);

		is.init(stream, charset, 1024, 0xFFFD);
	 	stat.value="辞書ファイルを開きました．\n";
		mDBConn.executeSimpleSQL("BEGIN TRANSACTION");
//		mDBConn.executeSimpleSQL("DROP TABLE IF EXISTS dict");
	 	stat.value+="登録を開始します．\n"
		stat_prev=stat.value;
		var loadbtn=document.getElementById('load');
		loadbtn.disabled=true;
		mDBConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS dict (key TEXT PRIMARY KEY,desc TEXT)");
  		statement = mDBConn.createStatement("INSERT INTO dict VALUES (?1,?2)");

		if (is instanceof Components.interfaces.nsIUnicharLineInputStream) {
			setTimeout('dict_loader();',10);
		}
	}
}
