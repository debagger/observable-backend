"use strict";
require('dotenv').config()
const autocannon = require("autocannon");
const { join, basename } = require("path");
const FormData = require("form-data");
const { readFileSync, writeFileSync } = require("fs");

const hostname = process.env.TARGETHOST;
console.log(`Target host "${hostname}"`)
function getForm() {
  const form = new FormData();
  const path = join(process.cwd(), "test.jpg");
  const buffer = readFileSync(path);
  form.append("file", buffer, {
    filename: basename(path),
  });
  return form;
}
const uploadResponses = [];
const instance = autocannon(
  {
    url: `http://${hostname}:3000/upload`,
    connections: 70,
    pipelining: 1,
    duration: 120,
    timeout: 100,
    requests: [
      {
        method: "POST",
        setupRequest(req) {
          const form = getForm();
          req.headers = form.getHeaders();
          req.body = form.getBuffer();
          return req;
        },
        onResponse(status, body, context) {
          if (status === 201) {
            uploadResponses.push(JSON.parse(body));
          }
        },
      },
      {
        method: "GET",
        setupRequest(req) {
          const rndId = Math.floor(Math.random() * uploadResponses.length);
          let rndItem = uploadResponses[rndId];
          if (!rndItem) rndItem = uploadResponses[0];
          const imgId = rndItem.id;
          req.href = `http://${hostname}:3000/info/${imgId}`;
          req.path = `/info/${imgId}`;
          req.pathname = `/info/${imgId}`;
          return req;
        },
      },
      {
        method: "GET",
        setupRequest(req) {
          const rndId = Math.floor(Math.random() * uploadResponses.length);
          const rndItem = uploadResponses[rndId];
          const filename = rndItem.filename;
          req.href = `http://${hostname}:3000/images/${filename}`;
          req.path = `/images/${filename}`;
          req.pathname = `/images/${filename}`;
          return req;
        },
      },
    ],
  },
  (err, result) => {
    writeFileSync(
      join(process.cwd(), "results", Date.now() + ".json"),
      JSON.stringify(result, undefined, 2),
      { encoding: "utf8" }
    );
    const exclude = new Set([
      "title",
      "url",
      "socketPath",
      "workers",
      "statusCodeStats",
      "latency",
      "requests",
      "throughput",
      "start",
      "finish",
    ]);
    const displayRes = {};
    for (const key in result) {
      if (Object.hasOwnProperty.call(result, key)) {
        const element = result[key];
        if (!exclude.has(key)) {
          displayRes[key] = element;
        }
      }
    }
    console.table([displayRes]);
    console.table([result.statusCodeStats]);
    const cleanp = (obj, stat) => {
      obj.Stat = stat;
      return obj;
    };
    console.table(
      [
        cleanp(result.latency, "Latency, ms"),
        cleanp(result.requests, "Req/Sec"),
        cleanp(result.throughput, "Bytes/Sec"),
      ],
      [
        "Stat",
        "average",
        "stddev",
        "min",
        "max",
        "p10",
        "p75",
        "p90",
        "p99",
        "totalCount",
        "total",
        "sent",
      ]
    );
  }
);
