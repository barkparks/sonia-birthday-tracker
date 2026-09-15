const STATUS = {
  name: "Tracker warming up...",
  note: "Saturday at 7:00pm, the plot begins. Check back for the latest public stop.",
  updated: "Updates begin party night"
};
document.querySelector('#current-name').textContent = STATUS.name;
document.querySelector('#current-note').textContent = STATUS.note;
document.querySelector('#updated').textContent = STATUS.updated;
