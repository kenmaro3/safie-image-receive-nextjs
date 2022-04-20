import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from '@tensorflow/tfjs';
import axios from "axios"
import qs from "querystring"
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { computeOutShape } from "@tensorflow/tfjs-core/dist/ops/segment_util";
import { loadGraphModel } from "@tensorflow/tfjs-converter";
import { Tensor3D } from "@tensorflow/tfjs-core";

axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*'


const useIntervalBy1s = (callback:() => void) => {
  const callbackRef = useRef<() => void>(callback);
  useEffect(() => {
    callbackRef.current = callback; // 新しいcallbackをrefに格納！
  }, [callback]);

  useEffect(() => {
    const tick = () => { callbackRef.current() } 
    const id = setInterval(tick,5000)
    return () => clearInterval(id)
  },[])
}

const Canvas = props => {
  
    const { draw, ...rest } = props
    const canvasRef = useRef(null)
    
    useEffect(() => {
      
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      canvas.style.border = "4px solid";
      
      const render = () => {
        draw(context)
      }
      render()
      
    }, [draw])
    
    return <canvas className={styles.canvas} ref={canvasRef} {...rest}/>
  }


const Home = () => {
  const [input, setInput] = useState<string>("1,2,3")
  const [result, setResult] = useState<string>("1,2,3")
  const [model, setModel] = useState<cocoSsd.ObjectDetection|null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isVideoReady, setIsVideoReady] = useState<string>("Not Ready");
  const [isModelReady, setIsModelReady] = useState<string>("Not Ready");
  const [canvasWidth, setCanvasWidth] = useState(716);
  const [canvasHeight, setCanvasHeight] = useState(403);

  const [res, setRes] = useState(null);

  const tmp = useIntervalBy1s(() => {

    if(isModelReady=="Ready"){

        (async () => {
            console.log('here1')

            const tmp  = await axios.get("/api/ai_safie")
            console.log('here2')
            console.log(tmp);

            let image = imgRef.current
            //image.setAttribute('src', tmp.data)
            image.setAttribute('src', "data:image/jpg;base64," + tmp.data);
            //image.src = tmp.data


        })()
    }
    else{
      console.log('here2')
    }
  })

  const loadModel = async() => {
    const tmp_model = await cocoSsd.load();
    setModel(tmp_model);
    setIsModelReady("Ready");
  }

  const scaleX = (x: Number) => {
      const tmp: Number = Number(x)/224.0*716;
      return tmp
  }

  const scaleY = (x: Number) => {
      const tmp: Number = Number(x)/224.0*403;
      return tmp
  }

  const drawOne = (ctx, item, borderColor) => {
    ctx.beginPath();
    
    //console.log(`${item.bbox[0]}, ${item.bbox[1]}, ${item.bbox[2]}, ${item.bbox[3]}`)
    ctx.font = "10px";
    ctx.fillStyle = "black";
    //ctx.fillText(`${item.class}`, item.bbox[0], item.bbox[1]);
    ctx.rect(item.bbox[0], item.bbox[1], item.bbox[2], item.bbox[3]);
    //ctx.rect(scaleX(item.bbox[0]), scaleY(item.bbox[1]), scaleX(item.bbox[2]), scaleY(item.bbox[3]));
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.closePath();
    ctx.stroke();
  }

  const draw = (ctx) => {
    if(res == null){
        return;
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    //ctx.fillStyle = "#FFFFFF"

    res.map((item, index) => {
        const borderColor = getColorByIndex(index);
        drawOne(ctx, item, borderColor);
    })
  }


  useEffect(()=> {
    (async () => {
        loadModel()
        console.log('here1')

        const tmp  = await axios.get("/api/ai_safie")
        console.log('here2')
        console.log(tmp);

        let image = imgRef.current
        //image.setAttribute('src', tmp.data)
        image.setAttribute('src', "data:image/jpg;base64," + tmp.data);
        //image.src = tmp.data
    })()
  }, [])


  useEffect(()=>{
    //if(videoRef.current == null || model == null){
    if(videoRef.current == null){
      return;
    }
    setIsVideoReady("Ready");
    
    // <video>の参照を取得
    let video = videoRef.current;

    // <video>にカメラのストリームを入力
    getVideo(video).then(video => {
    })
  },[videoRef]);

  const getVideo = (video: HTMLVideoElement):Promise<HTMLVideoElement> => {
    return navigator.mediaDevices
      .getUserMedia({ video: { width: 224, height: 224 } })
      .then(stream => {
        video.srcObject = stream;
        video.play();
        return video;

      })
  };

  const getColorByIndex = (index) => {
    var color = "#FF0000";
    var colors = ["#FF0000", "#fff000", "#ff7100", "#8fff00", "#7100ff", "#f000ff", "#00fff0"];
    try {
      if (index < colors.length - 1) {
        color = colors[index];
      } else {
        let random = Math.floor(Math.random() * ((colors.length - 1) + 1));
        color = colors[random];
      }
    } catch (e) {
      console.log(e);
    }
    return color;
  }


  const submit = (e) => {

    (async () => {
        let image = imgRef.current
        let input = tf.browser.fromPixels(image);
        console.log(input.shape)
        // setCanvasHeight(input.shape[0]);
        // setCanvasWidth(input.shape[1]);
        model.detect(input).then(res=> {
            console.log("detect")
            console.log(res)
            setRes(res);
        })
    })()
  }

  return (
    <div className={styles.container}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css" />

      <Head>
        <title>Safie Demo</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1>物体検出</h1>

        <div className={styles.canvasContainer}>
          <Canvas draw={draw} width={canvasWidth} height={canvasHeight}/>
          <img className={styles.image} ref={imgRef} ></img>

          <div className={styles.resultContainer}>
            <h3>Result</h3>

            {res?.map((item, index) => {
                return(
                    <>
                      <p>{item.class}: {(item.score*100).toPrecision(3)}%</p>
                    </>
                )
            })}
          </div>


        </div>

        <div className={styles.statusContainer}>
          <h3>Model: {isModelReady}</h3>
        </div>

        {/* <textarea value={input} onChange={(e)=> {setInput(e.target.value)}} placeholder="1,2,3"></textarea> */}
        <br />
        <button onClick={submit}>Detect</button>
        

      </main>
    </div>
  );
};


export default Home;
