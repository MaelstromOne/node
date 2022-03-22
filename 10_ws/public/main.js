/*global UIkit, Vue */

(() => {
  const notification = (config) =>
    UIkit.notification({
      pos: "top-right",
      timeout: 5000,
      ...config,
    });

  const alert = (message) =>
    notification({
      message,
      status: "danger",
    });

  const info = (message) =>
    notification({
      message,
      status: "success",
    });

  new Vue({
    el: "#app",
    data: {
      socket: null,
      intervalId: null,
      desc: "",
      activeTimers: [],
      oldTimers: [],
    },
    methods: {
      fetchActiveTimers() {
        this.socket.send(
          JSON.stringify({
            type: "fetchTimers",
            isActive: true,
          })
        );
      },
      fetchOldTimers() {
        this.socket.send(
          JSON.stringify({
            type: "fetchTimers",
            isActive: false,
          })
        );
      },
      createTimer() {
        const description = this.desc;
        this.desc = "";
        this.socket.send(
          JSON.stringify({
            type: "createTimer",
            description,
          })
        );
      },
      stopTimer(id) {
        this.socket.send(
          JSON.stringify({
            type: "stopTimer",
            id,
          })
        );
      },
      formatTime(ts) {
        return new Date(ts).toTimeString().split(" ")[0];
      },
      formatDuration(d) {
        d = Math.floor(d / 1000);
        const s = d % 60;
        d = Math.floor(d / 60);
        const m = d % 60;
        const h = Math.floor(d / 60);
        return [h > 0 ? h : null, m, s]
          .filter((x) => x !== null)
          .map((x) => (x < 10 ? "0" : "") + x)
          .join(":");
      },
      connect() {
        wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
        this.socket = new WebSocket(`${wsProtocol}//${location.host}`);

        this.socket.addEventListener("open", () => {
          this.fetchActiveTimers();
          this.intervalId = setInterval(() => {
            this.fetchActiveTimers();
          }, 1000);
          this.fetchOldTimers();
        });

        this.socket.addEventListener("message", (message) => {
          let data;
          try {
            data = JSON.parse(message.data);
          } catch (err) {
            alert(err.message);
          }
          switch (data.type) {
            case "activeTimers": {
              this.activeTimers = data.timers;
              break;
            }
            case "oldTimers": {
              this.oldTimers = data.timers;
              break;
            }
            case "createTimer": {
              info(`Created new timer "${data.description}" [${data.id}]`);
              this.fetchActiveTimers();
              break;
            }
            case "stopTimer": {
              info(`Stopped the timer [${data.id}]`);
              this.fetchActiveTimers();
              this.fetchOldTimers();
              break;
            }
          }
        });

        this.socket.addEventListener("close", () => {
          clearInterval(this.intervalId);
          setTimeout(() => {
            this.connect();
          }, 1000);
        });
      },
    },

    created() {
      this.connect();
    },
  });
})();
