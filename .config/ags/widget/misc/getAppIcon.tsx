import { Gtk, Gdk } from "ags/gtk4"
const _iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default()!)

export function getAppIcon(client: any): string {
  const clean = (s?: string) =>
    (s ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.+-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")

  const titleIcon = clean(client.initialTitle)
  if (titleIcon && _iconTheme.has_icon(titleIcon))
    return titleIcon

  const classIcon = client.class
  if (classIcon && _iconTheme.has_icon(classIcon))
    return classIcon

  return "application-x-executable"
}