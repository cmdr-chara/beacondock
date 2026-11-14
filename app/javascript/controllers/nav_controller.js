import { Controller } from "@hotwired/stimulus"

// Mobile navigation: toggles the link panel under the header bar.
// Keeps aria-expanded in sync and closes on Escape or link activation.
export default class extends Controller {
  static targets = ["toggle", "menu"]

  connect() {
    this.boundKeydown = (event) => {
      if (event.key === "Escape") this.close()
    }
    window.addEventListener("keydown", this.boundKeydown)
  }

  disconnect() {
    window.removeEventListener("keydown", this.boundKeydown)
  }

  toggle() {
    if (this.menuTarget.classList.contains("is-open")) {
      this.close()
    } else {
      this.open()
    }
  }

  open() {
    this.menuTarget.classList.add("is-open")
    this.toggleTarget.classList.add("is-open")
    this.toggleTarget.setAttribute("aria-expanded", "true")
  }

  close() {
    this.menuTarget.classList.remove("is-open")
    this.toggleTarget.classList.remove("is-open")
    this.toggleTarget.setAttribute("aria-expanded", "false")
  }
}
