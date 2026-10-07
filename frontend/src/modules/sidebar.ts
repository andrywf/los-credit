class Sidebar {
	mounted() {
		document.addEventListener(
			"sidebar:reload",
			this.render
		);
		this.render();
	}

	private render = async () => {
		// const containers = document.getElementById("sidebar-nav") as HTMLElement;

		// const menuData = await AggreDB.getAll('mst_menus');
		// if (!menuData || menuData.length === 0) return;

		// const menus = (await Promise.all(
		// 	menuData.map(async b => b.value
		// 		? JSON.parse(await Encrypt.decryptLocalData(b.value))
		// 		: b
		// 	)
		// ))
		// .filter(menu => menu && menu.is_active === true)
		// .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

		// const parents = menus.filter(menu => menu.parent_id === null || menu.parent_id === '');
		// const children = menus.filter(menu => menu.parent_id !== null && menu.parent_id !== '');

		// let menuHTML = '';

		// parents.forEach(parent => {
		// 	const parentChildren = children.filter(child => child.parent_id === parent.id);

		// 	if (parentChildren.length === 0) {
		// 			menuHTML += `
		// 				<li class="nav-item">
		// 					<a href="${parent.route}" data-route class="nav-link">
		// 						<i class="${parent.icon}"></i>
		// 						<span>${parent.name}</span>
		// 					</a>
		// 				</li>
		// 			`;
		// 	} else {
		// 		menuHTML += `
		// 			<li class="nav-item nav-item-submenu">
		// 				<a href="#" class="nav-link">
		// 					<i class="${parent.icon}"></i>
		// 					<span>${parent.name}</span>
		// 				</a>
		// 				<ul class="nav-group-sub collapse" data-group-label="${parent.name}">
		// 					${parentChildren.map(child => `
		// 						<li class="nav-item">
		// 							<a href="${child.route || '#'}" data-route class="nav-link">
		// 								${child.name}
		// 							</a>
		// 						</li>
		// 					`).join('')}
		// 				</ul>
		// 			</li>
		// 		`;
		// 	}
		// });
		// containers!.innerHTML = menuHTML;

		// document.dispatchEvent(
		// 	new CustomEvent("sidebar:ready")
		// );
	}
};

export default new Sidebar();