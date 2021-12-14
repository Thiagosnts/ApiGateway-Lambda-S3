function getValueIgnoringKeyCase(object, key) {
    const foundKey = Object
        .keys(object)
        .find(currentKey => currentKey.toLocaleLowerCase() === key.toLowerCase());
    return object[foundKey];
}

function getBoundary(header) {
    return getValueIgnoringKeyCase(header, 'Content-Type').split('=')[1];
}

function getBuffer(multipartBodyBuffer, boundary) {
    var prev = null;
    var lastline='';
    var header = '';
    var info = ''; var state=0; var buffer=[];var inputValue = '';
    var allParts = [];
    var retorna = false;
    for(let i=0;i<multipartBodyBuffer.length;i++){
        var oneByte = multipartBodyBuffer[i];
        var prevByte = i > 0 ? multipartBodyBuffer[i-1] : null;
        var newLineDetected = ((oneByte == 0x0a) && (prevByte == 0x0d)) ? true : false;
        var newLineChar = ((oneByte == 0x0a) || (oneByte == 0x0d)) ? true : false;

        if(!newLineChar){
            lastline += String.fromCharCode(oneByte);
        }

        if((0 == state) && newLineDetected){
            if(("--"+boundary) == lastline){
                state=1;
            }
            lastline='';
        }else
        if((1 == state) && newLineDetected){
            if(lastline.includes('filename')){
                retorna = true;
            }
            header = lastline;
            state=2;
            lastline='';
        }else
        if((2 == state) && newLineDetected){
            info = lastline;
            state=3;
            lastline='';
        }else
        if((3 == state) && newLineDetected){
            inputValue = lastline;
            state=4;
            buffer=[];
            lastline='';
        }else
        if(4 == state){
            if(lastline.length > (boundary.length+4)) lastline=''; // mem save
            if(((("--"+boundary) == lastline))){
                var j = buffer.length - lastline.length;
                var part = buffer.slice(0,j-1);
                var p = { header : header , info : info , part : new Buffer(part)  };
                allParts = p;
                if(retorna) {
                    return allParts;
                }
                buffer = []; lastline=''; state=5; header=''; info='';
            }else{
                buffer.push(oneByte);
            }
            if(newLineDetected) lastline='';
        }else
        if(5==state){
            if(newLineDetected)
                state=1;
        }
    }
    return allParts;
}

module.exports.parse = (header, multipartBody) => {
    const boundary = getBoundary(header);
    const object = {};

    `${multipartBody}`
        .split(boundary)
        .forEach(item => {
            if (/filename=".+"/g.test(item)) {
                object[item.match(/name=".+";/g)[0].slice(6, -2)] = {
                    type: 'file',
                    filename: `${new Date().getTime()}-${item.match(/filename=".+"/g)[0].slice(10, -1)}`,
                    contentType: item.match(/Content-Type:\s.+/g)[0].slice(14),
                    content: getBuffer(multipartBody, boundary)
                };
            } else if (/name=".+"/g.test(item)){
                object[item.match(/name=".+"/g)[0].slice(6, -1)] = item.slice(item.search(/name=".+"/g) + item.match(/name=".+"/g)[0].length + 4, -4);
            }
        });
    return object;
};
