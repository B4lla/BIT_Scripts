(function(){
	try {
		window.__nui_message_queue = window.__nui_message_queue || [];
		window.addEventListener('message', function(event) {
			const msg = event && event.data ? event.data : event;
			if (!msg || typeof msg !== 'object') return;
			if (!('type' in msg || 'action' in msg)) return;
			try {
				if (typeof window.__bit_dispatch === 'function') {
					window.__bit_dispatch(msg);
				} else {
					window.__nui_message_queue.push(msg);
				}
			} catch (e) {
				console.error('[nuiListener] Error', e);
			}
		});
	} catch (e) {
		console.error('[nuiListener] Fallback error:', e);
	}
})();
