const os = require("os");
const osu = require("node-os-utils");
const cpu = osu.cpu;
const drive = osu.drive;
const mem = osu.mem;
const { ipcRenderer } = require("electron");
const { settings } = require("cluster");

let cpuOverloadWarning;
let memOverloadWarning;
let alertFrequencyMinutes;

ipcRenderer.on("settings:get", (e, settings) => {
  document.getElementById("cpu-overload-warn").value =
    settings.cpuOverloadWarning;
  document.getElementById("ram-overload-warn").value =
    settings.memOverloadWarning;
  document.getElementById("alert-frequency").value =
    settings.alertFrequencyMinutes;

  cpuOverloadWarning = settings.cpuOverloadWarning;
  memOverloadWarning = settings.memOverloadWarning;
  alertFrequencyMinutes = settings.alertFrequencyMinutes;
});

const settingsForm = document.getElementById("settings-form");
settingsForm.addEventListener("submit", (e) => {
  e.preventDefault();

  cpuOverloadWarning = document.getElementById("cpu-overload-warn").value;
  memOverloadWarning = document.getElementById("ram-overload-warn").value;
  alertFrequencyMinutes = document.getElementById("alert-frequency").value;

  ipcRenderer.send("settings:set", {
    cpuOverloadWarning,
    memOverloadWarning,
    alertFrequencyMinutes,
  });

  M.toast({
    html: "Settings Saved!",
  });
});

const instance = M.Tabs.init(document.querySelectorAll(".tabs"), {
  swipeable: false,
});

const notifyUser = (options) => {
  new Notification(options.title, options);
};

if (os.platform() === "win32") {
  const hddTab = document.getElementById("hdd-tab");

  hddTab.addEventListener("click", () => {
    //todo find solution or create one for windows platform
    M.toast({
      html: `<blockquote> HDD info is not available on ${os.platform()} platform! </blockquote>`,
    });
  });
}

setInterval(() => {
  // CPU stats start
  const cpuPercentage = document.getElementById("cpu-usage");
  const cpuProgress = document.getElementById("cpu-progress");
  const cpuName = document.getElementById("cpu-name");
  const cpuSpeed = document.getElementById("cpu-base-speed");
  const cpuCores = document.getElementById("cpu-cores");

  cpu.usage().then((info) => {
    cpuPercentage.innerText = info;
    cpuProgress.style.width = info + "%";

    if (
      info >= cpuOverloadWarning &&
      runNotify(alertFrequencyMinutes, "lastNotifyCPUWarning")
    ) {
      notifyUser({
        title: "CPU Overload",
        body: `CPU is over ${cpuOverloadWarning}%`,
        icon: "../assets/icons/icon.svg",
      });

      localStorage.setItem("lastNotifyCPUWarning", +new Date());
    }
  });
  cpuName.innerText = cpu.model().substr(0, cpu.model().indexOf("@"));
  cpuSpeed.innerText = cpu.model().substr(cpu.model().indexOf("@") + 1);
  cpuCores.innerText = os.cpus().length;
  // CPU stats end

  // MEM stats start
  const memPercentage = document.getElementById("ram-usage");
  const memProgress = document.getElementById("ram-progress");
  const memTotal = document.getElementById("ram-total");
  const memUse = document.getElementById("ram-use");
  const memFree = document.getElementById("ram-available");

  mem.info().then((info) => {
    memPercentage.innerText = (100 - info.freeMemPercentage).toFixed(2);
    memProgress.style.width = 100 - info.freeMemPercentage + "%";
    memTotal.innerText = (info.totalMemMb / 1024).toFixed(2) + " GB";
    memUse.innerText = (info.usedMemMb / 1024).toFixed(2) + " GB";
    memFree.innerText = (info.freeMemMb / 1024).toFixed(2) + " GB";

    if (
      (100 - info.freeMemPercentage).toFixed(2) >= memOverloadWarning &&
      runNotify(alertFrequencyMinutes, "lastNotifyMEMWarning")
    ) {
      notifyUser({
        title: "Memory Overload",
        body: `Memory is over ${memOverloadWarning}%`,
        icon: "../assets/icons/icon.svg",
      });

      localStorage.setItem("lastNotifyMEMWarning", +new Date());
    }
  });
  // MEM stats end

  // HDD stats start

  if (os.platform() !== "win32") {
    const hddUsed = document.getElementById("hdd-usage");
    const hddUsedProgress = document.getElementById("hdd-used-progress");
    const hddFree = document.getElementById("hdd-free");
    const hddFreeProgress = document.getElementById("hdd-free-progress");
    const hddCapacity = document.getElementById("hdd-capacity");
    const hddUsedGb = document.getElementById("hdd-used-gb");
    const hddFreeGb = document.getElementById("hdd-free-gb");

    drive
      .info()
      .then((info) => {
        hddUsed.innerText = info.usedPercentage;
        hddUsedProgress.style.width = info.usedPercentage + "%";
        hddFree.innerText = info.freePercentage;
        hddFreeProgress.style.width = info.freePercentage + "%";
        hddCapacity.innerText = info.totalGb + " GB";
        hddUsedGb.innerText = info.usedGb + " GB";
        hddFreeGb.innerText = info.freeGb + " GB";
      })
      .catch((err) => {
        M.toast({
          html: err,
        });
      });
  }
  // HDD stats end

  // INFO stats start
  const osName = document.getElementById("info-os-name");
  const osType = document.getElementById("info-os-type");
  const osUptime = document.getElementById("info-uptime");
  const osHostname = document.getElementById("info-hostname");
  const osArch = document.getElementById("info-arch");

  osu.os.oos().then((info) => {
    osName.innerText = info;
  });

  osUptime.innerText = secondsToHumanReadableFormat(osu.os.uptime());
  osHostname.innerText = osu.os.hostname();
  osArch.innerText = osu.os.arch();
  osType.innerText = osu.os.type();

  // INFO stats end
}, 1000);

const secondsToHumanReadableFormat = (timeInSeconds) => {
  timeInSeconds = +timeInSeconds;

  const days = Math.floor(timeInSeconds / (3600 * 24));
  const hours = Math.floor((timeInSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;

  return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
};

const runNotify = (frequency, storageId) => {
  if (localStorage.getItem(storageId) === null) {
    localStorage.setItem(storageId, +new Date());
    return true;
  }

  const notifyTime = new Date(parseInt(localStorage.getItem(storageId)));
  const now = new Date();
  const diffTime = Math.abs(now - notifyTime);
  const minutesPassed = Math.ceil(diffTime / (60 * 1000));

  if (minutesPassed > frequency) {
    return true;
  }
  return false;
};
