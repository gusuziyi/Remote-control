<template>
  <div class="demo">
    <div class="rtcBox">
      <div>
        <div class="call-box">
            <button @click="Bcall">B发起连接</button>
              <button @click="hangup">挂断</button>
            <div :style="{'top':topA,'left':leftA}" class="a" ref="a" @click="aa">A被B控制</div>
            <div :style="{'top':topB,'left':leftB}" class="b" ref="b" @click="bb">B被A控制</div>
        </div>
          <h5>A收到消息</h5>
          <input type="text" v-model="receiveTextA">
            <h5>B收到消息</h5>
          <input type="text" v-model="receiveTextB">
      </div>
      <div>
         <div :hidden='!show' class="info-box">点击A打开,B隐藏</div>
          <div class="chat-box">
          <h5>发消息</h5>
          <textarea v-model="sendTextA"  @mousemove='updateXYA'></textarea>
          <br>
          <ul id='ul0'>
              <li id="A11"  @click="clickA">A11</li>
              <li id="A22"  @click="clickA">A22</li>
              <li id="A33"  @click="clickA">A33</li>
          </ul>
          <button @click="sendA()">A发送</button>
        </div>
        <div class="chat-box">
          <h5>发消息</h5>
          <textarea v-model="sendTextB"  @mousemove='updateXYB'></textarea>
          <br>
          <ul id='ul'>
              <li id="B11"    @click="clickB">B11</li>
              <li id="B22"    @click="clickB">B22</li>
              <li id="B33"    @click="clickB">B33</li>
          </ul>
          <button @click="sendB()">B发送</button>
        </div>
      </div>
    </div>
   
  </div>
</template>

<script>
export default {
  name: "local1",
  data() {
    return {
      peerA: null,
      peerB: null,
      channelA: null,
      channelB: null,
      offerOption: {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      },
      sendTextB: "",
      receiveTextB: "",
      sendTextA: "",
      receiveTextA: "",
      topA: "",
      leftA: "",
      topB: "",
      leftB: "",
      oldTopA: "",
      oldLeftA: "",
      oldTopB: "",
      oldLeftB: "",
      timerB: null,
      timerA: null,
      show: true,
    };
  },
  methods: {
    sendB() {
      if (!this.channelB) return;
      this.channelB.send(
        JSON.stringify({
          type: "msg",
          sendText: this.sendTextB,
        })
      );
    },
    sendA() {
      if (!this.channelA) return;
      this.channelA.send(
        JSON.stringify({
          type: "msg",
          sendText: this.sendTextA,
        })
      );
    },
    clickB(e) {
      if (!this.channelB) return;
      const { clientX, clientY, type, target, innerText } = e;
      console.log("Btarget", target.getAttribute("id"));
      this.channelB.send(
        JSON.stringify({
          clientX,
          clientY,
          type,
          target: target.getAttribute("id"),
          innerText,
        })
      );
    },
    clickA(e) {
      if (!this.channelA) return;
      const { clientX, clientY, type, target, innerText } = e;
      console.log("Atarget", target.getAttribute("id"));
      this.channelA.send(
        JSON.stringify({
          clientX,
          clientY,
          type,
          target: target.getAttribute("id"),
          innerText,
        })
      );
    },
    updateXYB: function(event) {
      if (this.channelB.readyState !== "open") return;
      if (this.timerB) return;
      console.log("Bmove event", event);
      const { clientX, clientY, type, target, innerText } = event;
      this.timerB = setTimeout(() => {
        clearTimeout(this.timerB);
        this.timerB = null;
        this.channelB.send(
          JSON.stringify({ clientX, clientY, type, target, innerText })
        );
      }, 200);
    },
    updateXYA: function(event) {
      if (!this.channelA) return;
      if (this.timerA) return;
      console.log("Amove event", event);
      const { clientX, clientY, type, target, innerText } = event;
      this.timerA = setTimeout(() => {
        clearTimeout(this.timerA);
        this.timerA = null;
        this.channelA.send(
          JSON.stringify({ clientX, clientY, type, target, innerText })
        );
      }, 200);
    },
    aa() {
      console.log("a---click");
    },
    bb() {
      console.log("b---click");
    },
    async Bcall() {
      if (!this.peerA || !this.peerB) {
        // 判断是否有对应实例，没有就重新创建
        this.initPeer();
      }
      try {
        let offer = await this.peerB.createOffer(this.offerOption); // 创建 offer
        await this.onCreateOffer(offer);
      } catch (e) {
        console.log("createOffer: ", e);
      }
    },
    hangup() {
      this.peerA.close();
      this.peerB.close();
      this.channelA.close();
      this.channelB.close();
      this.peerA = null;
      this.peerB = null;
      this.channelA = null;
      this.channelB = null;
      this.sendText = "";
      this.receiveText = "";
    },
    async onCreateOffer(desc) {
      try {
        await this.peerB.setLocalDescription(desc); // 呼叫端设置本地 offer 描述
      } catch (e) {
        console.log("Offer-setLocalDescription: ", e);
      }
      try {
        //实际通信时,这里要用http把Offer发送给TURN中继服务器,由中继服务器转发给peerA
        await this.peerA.setRemoteDescription(desc); // 接收端设置远程 offer 描述
      } catch (e) {
        console.log("Offer-setRemoteDescription: ", e);
      }
      try {
        let answer = await this.peerA.createAnswer(); // 接收端创建 answer
        await this.onCreateAnswer(answer);
      } catch (e) {
        console.log("createAnswer: ", e);
      }
    },
    async onCreateAnswer(desc) {
      try {
        await this.peerA.setLocalDescription(desc); // 接收端设置本地 answer 描述
      } catch (e) {
        console.log("answer-setLocalDescription: ", e);
      }
      try {
        //实际通信时,这里要用http把Offer发送给TURN中继服务器,由中继服务器转发给peerB
        await this.peerB.setRemoteDescription(desc); // 呼叫端设置远程 answer 描述
      } catch (e) {
        console.log("answer-setRemoteDescription: ", e);
      }
    },
    //插值算法,保证不卡顿
    insertValueA(y, x) {
      if (!this.topA || !this.leftA) {
        this.topA = this.oldTopA + "px";
        this.leftA = this.oldLeftA + "px";
        return;
      }
      let n = 9;
      let stepY = (y - this.oldTopA) / n;
      let stepX = (x - this.oldLeftA) / n;
      let insertValueATimer = setInterval(() => {
        this.topA = +this.topA.slice(0, this.topA.indexOf("px")) + stepY + "px";
        this.leftA =
          +this.leftA.slice(0, this.leftA.indexOf("px")) + stepX + "px";
        n--;
        if (n === 0) {
          clearInterval(insertValueATimer);
          insertValueATimer = null;
        }
      }, 20);

      this.oldTopA = y;
      this.oldLeftA = x;
    },
    insertValueB(y, x) {
      if (!this.topB || !this.leftB) {
        this.topB = this.oldTopB + "px";
        this.leftB = this.oldLeftB + "px";
        return;
      }
      let n = 9;
      let stepY = (y - this.oldTopB) / n;
      let stepX = (x - this.oldLeftB) / n;
      let insertValueBTimer = setInterval(() => {
        this.topB = +this.topB.slice(0, this.topB.indexOf("px")) + stepY + "px";
        this.leftB =
          +this.leftB.slice(0, this.leftB.indexOf("px")) + stepX + "px";
        n--;
        if (n === 0) {
          clearInterval(insertValueBTimer);
          insertValueBTimer = null;
        }
      }, 20);

      this.oldTopB = y;
      this.oldLeftB = x;
    },
    initPeer() {
      // 创建输出端 PeerConnection
      let PeerConnection =
        window.RTCPeerConnection ||
        window.mozRTCPeerConnection ||
        window.webkitRTCPeerConnection;
      this.peerA = new PeerConnection();
      // 监听 A 的ICE候选信息
      // 如果收集到，就添加给 B
      this.peerA.onicecandidate = (event) => {
        console.log("icea", event);
        if (event.candidate) {
          //实际通信时,这里要用http把event.candidate发送给TURN中继服务器,由中继服务器转发给peerB
          this.peerB.addIceCandidate(event.candidate);
        }
      };
      this.peerA.ondatachannel = (event) => {
        console.log("peerA ondatachannel", event);
        this.channelA = event.channel;
        this.channelA.binaryType = "arraybuffer";
        this.channelA.onopen = (e) => {
          console.log("channelA onopen", e);
        };
        this.channelA.onclose = (e) => {
          console.log("channelA onclose", e);
        };
        this.channelA.onmessage = (e) => {
          let m = JSON.parse(e.data);
          if (m.type === "click") {
            this.receiveTextA = "A收到了点击" + m.target;
            this.$refs["a"].click();
          } else if (m.type === "msg") {
            this.receiveTextA = "A收到了消息" + m.sendText;
            this.show = false;
          } else {
            console.log("channelA onmessage", JSON.parse(e.data));
            this.receiveTextA = "A收到了" + e.data + "";
            if (!this.oldTopA || !this.oldLeftA) {
              this.oldTopA = m.clientY;
              this.oldLeftA = m.clientX;
              return;
            }
            this.insertValueA(m.clientY, m.clientX);
          }
        };
      };
      // 创建呼叫端
      this.peerB = new PeerConnection();
      this.channelB = this.peerB.createDataChannel("messagechannel");
      this.channelB.binaryType = "arraybuffer";
      this.channelB.onopen = (event) => {
        console.log("channelB onopen", event);
      };
      this.channelB.onclose = function(event) {
        console.log("channelB onclose", event);
      };
      // 监听 B 的ICE候选信息
      // 如果收集到，就添加给 A
      this.peerB.onicecandidate = (event) => {
        console.log("iceb", event);
        if (event.candidate) {
          //实际通信时,这里要用http把event.candidate发送给TURN中继服务器,由中继服务器转发给peerA
          this.peerA.addIceCandidate(event.candidate);
        }
      };
      this.channelB.onmessage = (e) => {
        let m = JSON.parse(e.data);
        if (m.type === "click") {
          this.receiveTextB = "B收到了点击" + m.target;
          this.$refs["b"].click();
        } else if (m.type === "msg") {
          this.receiveTextB = "B收到了消息" + m.sendText;
          this.show = true;
        } else {
          console.log("channelB onmessage", JSON.parse(e.data));
          this.receiveTextB = "b收到了" + e.data + "";
          if (!this.oldTopB || !this.oldLeftB) {
            this.oldTopB = m.clientY;
            this.oldLeftB = m.clientX;
            return;
          }
          this.insertValueB(m.clientY, m.clientX);
        }
      };
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initPeer();
    });
  },
};
</script>

<style lang="scss">
.rtcBox {
  display: flex;
  justify-content: center;
  .info-box {
    background-color: blueviolet;
    font-size: 22px;
    color: white;
    margin-bottom: 50px;
  }
  .call-box {
    height: 180px;
    border-bottom: 1px solid #1fbeca;
    margin-bottom: 10px;
  }
  .call {
    width: 400px;
    height: 300px;
    margin-left: 20px;
    background-color: #ddd;
  }
  .chat-box {
    border: 1px solid red;
    margin-bottom: 20px;
    text-align: center;
    h5 {
      margin-bottom: 10px;
    }
    p,
    textarea {
      width: 240px;
      height: 60px;
      border: 1px solid #000;
      display: inline-block;
    }
  }
}
.a {
  position: absolute;
  width: 50px;
  height: 50px;
  background-color: green;
}
.b {
  position: absolute;
  width: 40px;
  height: 40px;
  background-color: red;
}
</style>
