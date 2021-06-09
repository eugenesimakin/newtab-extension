// bookmarks.json is an array of objects:
// [ { "name": "YouTube", "url": "https://www.youtube.com/", "icon": "./features/bookmarks/assets/icons/youtube.ico" } ]
fetch('./features/bookmarks/bookmarks.json')
  .then(resp => resp.json())
  .then(bookmarks => {
    const el = document.getElementById('bookmarks');
    if (!el) throw Error('bookmarks: root element is not found');
    if (!Array.isArray(bookmarks)) throw Error('bookmarks: json should be an array');

    const html = bookmarks.map(bookmark =>
      `<a href="${bookmark.url}">
			<div class="icon">
				<img src="${bookmark.icon}" />
			</div>
			<div class="title">
				<span>
					${bookmark.name}
				</span>
			</div>
		</a>`
    ).join('');

    el.innerHTML = html;
  })