// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import type { NextApiRequest, NextApiResponse } from 'next'
import { EXAMPLE_VECTOR, PublicParam, calcDistance, initContext,desiralizePub, PROMISE_SEAL } from "../../libs/ckks"
import axios from "axios"

function base64Encode(imgData) {
  // arraybuffer で渡された imgData を base64 エンコードする
  const base64Encoded = imgData.toString('base64');
  return base64Encoded;
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    console.log('here1')
    res.setHeader('Content-Type', 'image/jpeg')

    var instance = axios.create({
      'responseType': 'arraybuffer',
      'headers': {
        'Content-Type': 'image/jpeg'
      }
  });

    const tmp = await axios.get('https://openapi.safie.link/v1/devices/xxxxxxxxxxxxxx/image', { // xxxxxxxxxxx にデバイスIDを書く
        headers: {
            Authorization: `Bearer yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`, // yyyyyyyyyyyy にbaarer トークンを書く

        },
        responseType: "arraybuffer"
    })

    
    console.log('here2')
    console.log(tmp);

    // res.setHeader('Content-Length', tmp.data)
    //res.send(base64Encode(tmp.data))
    res.send(base64Encode(tmp.data))
    res.status(200).end()


}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1gb',
    },
  },
}