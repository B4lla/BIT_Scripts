(function(){
	try {
		window.__nui_message_queue = window.__nui_message_queue || [];
		window.addEventListener('message', function(event) {
			try {
				const msg = event && event.data ? event.data : event;

				if (typeof DOMException !== 'undefined' && msg instanceof DOMException) {
					console.warn('[nuiListener] Ignoring DOMException posted as message:', msg);
					return;
				}
				
				if (window.debugMode) {
					console.log('[BIT-DEBUG-NUI] Received message:', msg);
				}
				
				if (!msg || typeof msg !== 'object') {
					console.warn('[nuiListener] Invalid message format:', msg);
					if (window.debugMode) {
						console.log('[BIT-DEBUG-NUI] Invalid message details:', {type: typeof msg, value: msg});
					}
					return;
				}
				
				if (!('type' in msg || 'action' in msg)) {
					console.warn('[nuiListener] Message missing type/action:', msg);
					return;
				}
				
				if (!msg.action && !msg.type) {
					console.warn('[nuiListener] Message has neither action nor type:', msg);
					return;
				}
				
				if (msg.type === 'enableDebugMode') {
					window.debugMode = true;
					console.log('[BIT-DEBUG-NUI] Debug mode enabled');
					return;
				}
				
				if (typeof window.__bit_dispatch === 'function') {
					if (window.debugMode) {
						console.log('[BIT-DEBUG-NUI] Dispatching message:', msg);
					}
					try {
						window.__bit_dispatch(msg);
					} catch (dispatchErr) {
						console.error('[BIT-DEBUG-NUI] Error inside __bit_dispatch:', dispatchErr, 'Message:', msg);
					}
				} else {
					if (window.debugMode) {
						console.log('[BIT-DEBUG-NUI] Queuing message (dispatcher not ready):', msg);
					}
					window.__nui_message_queue.push(msg);
				}
			} catch (e) {
				console.error('[nuiListener] Error processing message:', e, 'Event:', event);
			}
		});
	} catch (e) {
		console.error('[nuiListener] Fallback error:', e);
	}
})();
