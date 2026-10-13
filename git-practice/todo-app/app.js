 const form = document.querySelector('#add-form');
 const input = document.querySelector('#task-input');
 const tip = document.querySelector('#tip');
 const list = document.querySelector('#task-list');
 
 let tasks = [];
 
 const render = () => {
   list.innerHTML = '';
   if (tasks.length === 0) {
     const li = document.createElement('li');
     li.textContent = '暂无任务';
     list.appendChild(li);
     return;
   }
   tasks.forEach(task => {
     const li = document.createElement('li');
     li.textContent = task.text;
     if (task.done) li.classList.add('done');
     list.appendChild(li);
   });
 };
 
 form.addEventListener('submit', (e) => {
   e.preventDefault();
   const text = input.value.trim();
   if (text === '') {
     tip.textContent = '任务名不能为空';
     return;
   }
   tasks.push({ text: text, done: false });
   tip.textContent = '';
   input.value = '';
   render();
 });
 
 render();