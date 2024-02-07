const fs = require("fs");
const express = require("express");
const app = express();
const port = 3000;
const { spawn } = require("node:child_process");
app.use(express.static('files'))
let procs = [];
class createProcess {
  constructor(procName, args, id) {
    this.procName = procName;
    this.args = args;
    this.proc = null;
    this.id = id;
  }

  start() {
    const out = fs.openSync(`./logs/${this.id}-out.log`, "a");
    const err = fs.openSync(`./logs/${this.id}-out.log`, "a");
    try{
      this.proc = spawn(`${this.procName}`, this.args, {
        cwd: "./files",
        detached: true,
        stdio: ["ignore", out, err],
        env:{PATH:__dirname+"/apps/"}
      });
    } catch(e){
      console.log(e)
    }

    this.proc.on("close", (code) => {
      console.log(`processes number ${this.proc.pid} closed with: ${code}`);
      if (procs.length > 0)
        procs.splice(
          procs.find((p) => p.id == this.id),
          1
        );
    });
    return this.proc;
  }

  kill() {
    process.kill(this.proc.pid, 1);
  }
}
function getArgs(argObject) {
  let args = [];
  for (let arg in argObject) {
    args.push(argObject[arg].toString().trim());
  }
  return args;
}

app.get("/", (req, res) => {
  res.send({
    runingProc: procs,
    help: "go to /help",
  });
});
app.get("/help", (req, res) => {
  res.send(`<div style="white-space: pre-line">
  <h1>Help</h1>
  there is <a href="/default" target="_blank">Default config</a>
<table><tbody><tr><th>command</th><th>info</th></tr><tr><td>/</td><td>view the running processes</td></tr><tr><td>/help</td><td>the help page</td></tr><tr><td>/proc/id</td><td>view the process with the specific id</td></tr><tr><td>/proc/id/kill</td><td>kill the process with the specific id</td></tr><tr><td>/ytdl?arg1=...&amp;arg2=...</td><td>using <a href="https://github.com/yt-dlp/yt-dlp?tab=readme-ov-file#usage-and-options" target="_blank">yt-dlp</a> as if you are in command line</td></tr><tr><td>/ffmpeg?arg1=...&amp;arg2=...</td><td>using <a href="https://ffmpeg.org/ffmpeg.html" target="_blank">ffmepg</a> as if you are in command line</td></tr><tr><td>/ffprobe?arg1=...&amp;arg2=...</td><td>using <a href="https://ffmpeg.org/ffprobe.html" target="_blank">ffprobe</a> as if you are in command line</td></tr></tbody></table>
</div>`);
});
app.get("/default", (req, res) => {
  res.sendFile("./files/yt-dlp.conf")
});
app.get("/fs",(req,res)=>{
  let html = '<html><body><h1>Files</h1><br><div style="font-size:1.8rem;display:flex;flex-direction: column">'
  fs.readdir(__dirname+"/files/",(err,files)=>{
    files.forEach(file=>{
      html += `<div style="display:flex;align-items:center"><a target="_blank" href=/${file}>${file}</a><p style="margin:0;padding-left: 20px;font-size:1.5rem">Size:${Math.floor(fs.statSync(__dirname+"/files/"+file).size/(1024*1024))}MB</p></div>`
    })
    html += "</div></body></html>"
    res.send(html)
  })
})
app.get("/ytdl", (req, res) => {
  let id = Math.floor(Math.random() * 10000);
  let args = req.query.cmd ? req.query.cmd.toString().split(" ") : getArgs(req.query);
  let proc = new createProcess("yt-dlp_linux",args, id).start();
  procs.push({ proc: proc, id: id });
  res.send({ runingProc: procs });
});
app.get("/update", (req, res) => {
  let proc = new createProcess("yt-dlp",["-U"], id).start();
  procs.push({ proc: proc, id: id });
  res.send({ runingProc: procs });
  
});
app.get("/ffmpeg", (req, res) => {
  let id = Math.floor(Math.random() * 10000);
  let args = req.query.cmd ? req.query.cmd.toString().split(" ") : getArgs(req.query);
  let proc = new createProcess("ffmpeg", args, id).start();
  procs.push({ proc: proc, id: id });
  res.send({ runingProc: procs });
});
app.get("/ffprobe", (req, res) => {
  let id = Math.floor(Math.random() * 10000);
  let proc = new createProcess("ffprobe", getArgs(req.query), id).start();
  procs.push({ proc: proc, id: id });
  res.send({ runingProc: procs });
});
app.get("/proc/:id", (req, res) => {
  let id = req.params.id.toString();
  fs.readFile(`./logs/${id}-out.log`, (err, data) => {
    if (err) {
      res.send({ id: id, msg: "Proc not found" });
    } else {
      // res.send({ id:id,msg:data.toString()});
      res.send(`<div style="white-space: pre-line">${data.toString()}</div><script type="text/javascript">
   setTimeout(()=>window.scrollTo(0, document.body.scrollHeight),500)
</script>`);
    }
  });
});
app.get("/proc/:id/full", (req, res) => {
  let id = req.params.id.toString();
  fs.readFile(`${id}-out.log`, (err, data) => {
    if (err) {
      res.send({ id: id, msg: "Proc not found" });
    } else {
      res.send({ id: id, msg: data.toString() });
    }
  });
});
app.get("/proc/:id/kill", (req, res) => {
  let id = req.params.id.toString();
  if (procs.length > 0) procs.find((p) => p.id == id).proc.kill();
  res.send({ id: id, msg: "Processes killed" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
