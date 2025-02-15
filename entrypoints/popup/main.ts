function initializeScript() {

  const saveButton = document.getElementById('save')
  if (!saveButton) {
    console.error('Save button not found')
    return
  }

  saveButton.addEventListener('click', saveApiKey)
}

async function saveApiKey() {
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement
  if (!apiKeyInput) {
    console.error('API key input not found')
    return
  }

  const apiKey = apiKeyInput.value
  await chrome.storage.local.set({ apiKey: btoa(apiKey) })

  if (chrome.runtime.lastError) {
    console.error('Storage error:', chrome.runtime.lastError)
    return
  }

  const status = document.getElementById('status')
  if (status) {
    status.textContent = 'API key saved!'
    setTimeout(() => {
      status.textContent = ''
    }, 2000)
  }
}

initializeScript()
