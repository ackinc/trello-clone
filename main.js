const boards = JSON.parse(localStorage.getItem('boards') || '[]');
let cur_board = null;

const main_node = document.querySelector('main');

const create_board_html = `<button class="board-like create-board">Create Board...</button>`;
const new_board_html = `<form id="new-board-form" class="board-like">
                            <input type="text" name="board-name" class="board-name-input" placeholder="Enter name..." required autocomplete="off" />
                        </form>`;

const create_list_html = `<button class="create-list">Create List...</button>`;
const new_list_html = `<form id="new-list-form" class="list-like">
                           <input type="text" name="list-name" class="list-name-input" placeholder="Enter name..." required autocomplete="off" />
                           <button type="submit">Add</button>
                           <button>Cancel</button>
                       </form>`;

document.addEventListener('DOMContentLoaded', (e) => showBoards(boards));
main_node.addEventListener('click', handleClick);

function showBoards(boards) {
    main_node.classList.remove('lists');
    main_node.classList.add('boards');

    main_node.innerHTML = renderBoards(boards) + create_board_html;
    cur_board = null;
}

function renderBoards(boards) {
    return boards.map(board => `<div class="board board-like">
                                    <div class="board-content">
                                        <h1>${board.title}</h1>
                                    </div>
                                    <div class="board-controls">
                                        <span class="edit-board">E</span>
                                        <span class="close-board">X</span>
                                    </div>
                                </div>`).join('');
}

function handleClick(e) {
    let node;

    if (node = getNearestParentWithClass(e.target, 'create-board')) {

        showNewBoardForm();

    } else if (node = getNearestParentWithClass(e.target, 'close-board')) {

        closeBoard(getNearestParentWithClass(node, 'board'));

    } else if (node = getNearestParentWithClass(e.target, 'edit-board')) {

        allowEditBoardName(getNearestParentWithClass(node, 'board'));

    } else if (node = getNearestParentWithClass(e.target, 'board')) {

        showLists(boards[getBoardIndex(node)]);

    } else if (node = getNearestParentWithClass(e.target, 'create-list')) {

        showNewListForm();

    } else if (node = getNearestParentWithClass(e.target, 'list-item-mark-done')) {

        toggleListItemDone(getNearestParentWithClass(node, 'list-item'));

    } else if (node = getNearestParentWithClass(e.target, 'list-item-delete')) {

        deleteListItem(getNearestParentWithClass(node, 'list-item'));

    }

}

function showNewBoardForm() {
    if (main_node.querySelector('form#new-board-form') === null) {
        main_node.innerHTML = new_board_html + main_node.innerHTML;

        const form = main_node.querySelector('form');
        const input = form.querySelector('input[name="board-name"]');

        form.addEventListener('click', e => input.focus());
        form.addEventListener('submit', e => {
            createBoard(input.value)
            e.preventDefault();
        });

        // NOTE: clicking on "create board" when input is active leads to funny behaviour?
        input.addEventListener('blur', e => {
            if (e.explicitOriginalTarget !== form) hideNewBoardForm();
        });
        input.focus();
    } else {
        // do nothing if the new board form is already being shown
    }
}

function hideNewBoardForm() {
    const form = main_node.querySelector('form#new-board-form');
    if (form !== null) main_node.removeChild(form);
}

function createBoard(name) {
    boards.unshift({ title: name, lists: [] });
    localStorage.boards = JSON.stringify(boards);
    showBoards(boards);
}

function closeBoard(board) {
    boards.splice(getBoardIndex(board), 1);
    localStorage.boards = JSON.stringify(boards);
    board.parentNode.removeChild(board);
}

function allowEditBoardName(board_node) {
    const board_content_node = board_node.querySelector('.board-content')
    const board_title_node = board_content_node.querySelector('h1');

    if (!board_title_node) return; // this board is already being edited

    const input_html = `<input type="text" class="board-name-input" value="${board_title_node.innerText}" />`;
    board_content_node.innerHTML = input_html;

    const board_title_input_node = board_content_node.querySelector('input');
    board_title_input_node.addEventListener('blur', function (e) {
        if (this.value !== "") editBoardName(board_node, this.value);
    });
    board_title_input_node.addEventListener('keyup', function (e) {
        if (e.key === "Enter" && this.value !== "") editBoardName(board_node, this.value);
    });

    board_title_input_node.focus();
}

function editBoardName(board_node, new_name) {
    boards[getBoardIndex(board_node)].title = new_name;
    localStorage.boards = JSON.stringify(boards);

    board_node.querySelector('.board-content').innerHTML = `<h1> ${new_name}</h1>`;
}

function showLists(board) {
    main_node.classList.remove('boards');
    main_node.classList.add('lists');

    const lists = board.lists;
    main_node.innerHTML = renderLists(lists) + `<div id="new-list-control-div">${create_list_html}</div>`;

    main_node.querySelectorAll('.list input').forEach(elem => {
        elem.addEventListener('keyup', function (e) {
            if (e.key === "Enter" && this.value !== "") {
                addItemToList(getNearestParentWithClass(this, 'list'), this.value);
            }
        });
    });

    // list item controls should be shown/hidden based on mouse position
    main_node.querySelectorAll('.list .list-item').forEach(elem => {
        elem.addEventListener('mouseover', function (e) {
            this.querySelector('.list-item-controls').classList.remove('hidden');
        });
        elem.addEventListener('mouseout', function (e) {
            this.querySelector('.list-item-controls').classList.add('hidden');
        });
    });

    cur_board = board;
}

function renderLists(lists) {
    return lists.map((list, idx) => `<div class="list list-like" data-idx="${idx}">
                                        <h1>${list.title}</h1>
                                        <ol class="list-items">
                                            ${list.items.map(renderListItem).join('')}
                                        </ol>
                                        <div class="add-list-item"><input type="text" placeholder="Add item..." /></div>
                                    </div>`).join('');
}

function renderListItem(li, idx) {
    return `<li class="list-item ${li.done ? 'done' : ''}" data-idx="${idx}">
                <span class="list-item-desc">${li.desc}</span>
                <span class="list-item-controls hidden">
                    <span class="list-item-mark-done">D</span>
                    <span class="list-item-delete">X</span>
                </span>
            </li>`;
}

function showNewListForm() {
    const new_list_control_div = main_node.querySelector('#new-list-control-div');
    new_list_control_div.innerHTML = new_list_html;

    const form = main_node.querySelector('#new-list-form');
    const input = form.querySelector('input');
    const cancel_btn = form.querySelector('button:last-child');

    form.addEventListener('submit', e => {
        e.preventDefault();
        createList(cur_board, input.value);
    });
    cancel_btn.addEventListener('click', e => {
        showLists(cur_board);
    });
    input.focus();
}

function createList(board, title) {
    board.lists.push({ title: title, items: [] });

    showLists(cur_board);
    localStorage.boards = JSON.stringify(boards);
}

function addItemToList(list_node, item) {
    cur_board.lists[+list_node.dataset.idx].items.push({ desc: item, done: false });

    showLists(cur_board);
    localStorage.boards = JSON.stringify(boards);
}

function toggleListItemDone(list_item_node) {
    const item_idx = list_item_node.dataset.idx;
    const list_idx = getNearestParentWithClass(list_item_node, 'list').dataset.idx;

    console.log(cur_board.lists[list_idx].items[item_idx].done);
    cur_board.lists[list_idx].items[item_idx].done = !cur_board.lists[list_idx].items[item_idx].done;
    console.log(cur_board.lists[list_idx].items[item_idx].done);

    showLists(cur_board);
    localStorage.boards = JSON.stringify(boards);
}

function deleteListItem(list_item_node) {
    const item_idx = list_item_node.dataset.idx;
    const list_idx = getNearestParentWithClass(list_item_node, 'list').dataset.idx;
    cur_board.lists[list_idx].items.splice(item_idx, 1);

    showLists(cur_board);
    localStorage.boards = JSON.stringify(boards);
}

// helper functions

function getBoardIndex(board_node) {
    let idx = 0, cur = main_node.querySelector('.board');
    if (cur === null) return -1;

    while (cur !== board_node) {
        idx++;
        cur = cur.nextSibling;
    }

    return idx;
}

function getNearestParentWithClass(node, req_class) {
    // the empty array guard in the second condition below is needed because
    //   traversing the DOM upwards will eventually cause us to reach the html element,
    //   whose classList property is undefined
    while (node !== null && !Array.prototype.includes.call(node.classList || [], req_class)) {
        node = node.parentNode;
    }
    return node;
}
