import { Controller } from "@hotwired/stimulus"

// Copies the text of a [data-clipboard-target="source"] element to the
// clipboard and briefly swaps the button label to the "copied" word.
// Used for one-time secrets (API tokens) where a manual select is error-prone.
export default class extends Controller {
  static targets = ["source", "button"]
  static values = { copied: String }

  async copy() {
    const text = this.sourceTarget.textContent.trim()
    let ok = false

    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      // Fallback for contexts without the async clipboard API.
      const area = document.createElement("textarea")
      area.value = text
      area.setAttribute("readonly", "")
      area.style.position = "fixed"
      area.style.opacity = "0"
      document.body.appendChild(area)
      area.select()
      try {
        ok = document.execCommand("copy")
      } catch {
        ok = false
      }
      area.remove()
    }

    if (!ok || !this.hasButtonTarget) return

    const button = this.buttonTarget
    const original = button.dataset.clipboardOriginal || button.textContent
    button.dataset.clipboardOriginal = original
    button.textContent = this.copiedValue || "Copied"
    button.classList.add("is-copied")

    clearTimeout(this.resetTimer)
    this.resetTimer = setTimeout(() => {
      button.textContent = original
      button.classList.remove("is-copied")
    }, 1600)
  }
}
