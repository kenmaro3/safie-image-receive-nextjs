import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";


const Home = () => {
  return (
    <div className={styles.container}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css" />

      <Head>
        <title>Safie Demo</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>

        Demo

        <ul>
          <li ><Link href="/ai">FrontCamera</Link></li>
          <li ><Link href="/ai_safie">Safie Camera</Link></li>
        </ul>
      </main>
    </div>
  );
};


export default Home;