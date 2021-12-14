
'use strict';

const AWS = require('aws-sdk');
const multipart = require('./multparse.js');

AWS.config.update({region: 'us-east-1'});

const s3 = new AWS.S3();



exports.handler = function(event,context,callback){


    let header = event.params.header;
    let variables = event.variables;

    let body = new Buffer.from(event['body-json'].toString(),'base64');
    let object = {};
    let url = '';
    console.log(`BODY: ${JSON.stringify(event)}`);

    // convert o objeto multprat enviado
    object = multipart.parse(header, body);
    
    //console.log(`BODY: ${JSON.stringify(event)}`);



    if(object.arquivos) {
        s3.putObject({
            Bucket: variables.s3bucket,
            Key: object.arquivos.filename,
            Body: object.arquivos.content.part,
            ACL: 'public-read'
        },(err, data) => {
            if(err) {
                callback(new Error(`Erro ao gravar o arquivo: ${err}`));
            }
        });

     


        
        url = s3.getSignedUrl('getObject', {
            'Bucket': variables.s3bucket,
            'Key': object.arquivos.filename
        });
        // removo o objeto de buffer
        delete object.arquivos['content'];
        
        
        
        

        // // adiciono a url do arquivo
        // object.arquivos['url'] = url;
        // console.log(`URL: ${url}`);
        // console.log(`OBJECT ARQUIVO URL: ${JSON.stringify(object.arquivos)}`);
    }


 
 callback(null,{status: 'ok', code: 200, messages: ['Chamado aberto com sucesso.']});
}