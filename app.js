const storageKey = "stroke-daily-checkin";
const form = document.querySelector("#checkin-form");
const confidence = document.querySelector("#confidence");
const confidenceValue = document.querySelector("#confidence-value");
const toast = document.querySelector("#toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3500);
}

function updateTasks() {
  const tasks = [...document.querySelectorAll(".task")];
  const completed = tasks.filter((task) => task.querySelector("input").checked).length;
  document.querySelector("#task-progress").textContent = `${completed}/${tasks.length}`;
  document.querySelector("#goal-value").textContent = `${Math.round((11 + completed - 1) / 16 * 100)}%`;
  tasks.forEach((task) => task.classList.toggle("done", task.querySelector("input").checked));
  localStorage.setItem("stroke-daily-tasks", JSON.stringify(tasks.map((task) => task.querySelector("input").checked)));
}

function restoreState() {
  const savedCheckin = JSON.parse(localStorage.getItem(storageKey) || "null");
  if (savedCheckin) {
    document.querySelector("#activity").value = savedCheckin.activity;
    document.querySelector("#medication").value = savedCheckin.medication;
    document.querySelector("#note").value = savedCheckin.note;
    confidence.value = savedCheckin.confidence;
    confidenceValue.textContent = savedCheckin.confidence;
    const status = document.querySelector("#checkin-status");
    status.textContent = "บันทึกแล้ว";
    status.classList.add("complete");
  }

  const savedTasks = JSON.parse(localStorage.getItem("stroke-daily-tasks") || "null");
  if (savedTasks) {
    document.querySelectorAll(".task input").forEach((input, index) => { input.checked = Boolean(savedTasks[index]); });
  }
  updateTasks();
}

confidence.addEventListener("input", () => { confidenceValue.textContent = confidence.value; });

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const checkin = {
    activity: document.querySelector("#activity").value,
    medication: document.querySelector("#medication").value,
    confidence: confidence.value,
    note: document.querySelector("#note").value.trim(),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(storageKey, JSON.stringify(checkin));
  const status = document.querySelector("#checkin-status");
  status.textContent = "บันทึกแล้ว";
  status.classList.add("complete");
  showToast("บันทึกข้อมูลวันนี้เรียบร้อยแล้ว ขอบคุณที่ดูแลตัวเองนะครับ");
});

document.querySelectorAll(".task input").forEach((input) => input.addEventListener("change", updateTasks));
document.querySelectorAll("[data-message]").forEach((button) => button.addEventListener("click", () => showToast(button.dataset.message)));

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("th-TH", { dateStyle: "full" }).format(new Date());
window.addEventListener("load", () => window.lucide?.createIcons());
restoreState();
