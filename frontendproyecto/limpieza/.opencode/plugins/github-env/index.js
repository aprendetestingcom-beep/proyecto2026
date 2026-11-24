import { watch } from "node:fs"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { Plugin } from "@opencode/plugin"

// Lee GITHUB_PERSONAL_ACCESS_TOKEN desde el .env del proyecto y lo inyecta en el
// servidor MCP "github" declarado en opencode.json.
// OpenCode no carga .env por sí solo, así que este plugin mantiene el token en un
// único lugar (el .env, ignorado por git) y reacciona cuando se edita.

function parseDotenv(text) {
  const out = {}
  for (const rawLine of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) out[key] = value
  }
  return out
}

export default Plugin.define({
  id: "project.github-env",
  async setup(ctx) {
    const envPath = join(ctx.location.directory, ".env")
    let token = ""

    const readToken = async () => {
      try {
        const env = parseDotenv(await readFile(envPath, "utf8"))
        token = (env.GITHUB_PERSONAL_ACCESS_TOKEN ?? "").trim()
      } catch {
        token = ""
      }
      return token
    }

    await readToken()
    await ctx.mcp.transform((editor) => {
      if (!token) return
      if (!editor.get("github")) return
      editor.update("github", (server) => {
        server.headers = { ...(server.headers ?? {}), Authorization: `Bearer ${token}` }
      })
    })

    // Al guardar .env, vuelve a leer el token y reconecta el MCP.
    let timer
    const watcher = watch(ctx.location.directory, { persistent: false }, (_event, file) => {
      if (file && String(file) !== ".env") return
      clearTimeout(timer)
      timer = setTimeout(async () => {
        const before = token
        await readToken()
        if (token === before) return
        try {
          await ctx.mcp.reload()
        } catch (error) {
          console.error("[github-env] no se pudo recargar el MCP:", error)
        }
      }, 200)
    })

    return () => {
      clearTimeout(timer)
      watcher.close()
    }
  },
})
