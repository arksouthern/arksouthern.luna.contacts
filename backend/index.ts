import { Stats } from "fs"
import { readdir, readFile, stat, writeFile, cp, rm, rename } from "fs/promises"
import { basename, dirname } from "path"
import { Shortcut } from "~/Types"
import {CompactContact, Contact, LunaContactsApi, VcfArrayItem} from "../../../../../../backend/api/reusable/contacts"
import Vcf from "vcf"

export const api = {
	dirList: async (props: { path: string }) => {
		console.log(props.path)
		const dir = dirname(props.path)
		return api.folderOnlyRead({ dir })
	},
	folderOnlyRead: async (props: { dir: string }) => {
		const dirFiles = await readdir(props.dir)
		const files = [] as FioStat[]
		for (const dirFile of dirFiles) {
			try {
				const file = await stat(`${props.dir}/${dirFile}`) as FioStat
				file.name = dirFile
				file.type = file.isDirectory() ? { as: "folder", fios: [] } : { as: "file" }
				files.push(file)
			} catch (error) {
				console.log(error)
			}
		}
		return files
	},
	folderRead: async (props: { dir: string }) => {
		const dirFiles = await readdir(props.dir)
		const files = [] as CompactContact[]
		for (const dirFile of dirFiles) {
			try {
				const file = await stat(`${props.dir}/${dirFile}`) as FioStat
				if (dirFile.endsWith(".vcf") || dirFile.endsWith(".vcard")) 
					files.push(
						LunaContactsApi.contactToContactCompact(
							await LunaContactsApi.contactReadVcard({ originalDir: props.dir, filePath: `${props.dir}/${dirFile}` })
						)
					)
				else if (file.isDirectory()) 
					dirFiles.push(
						...(await readdir(`${props.dir}/${dirFile}`))
							.map(x => `${dirFile}/${x}`)
					)
			} catch (error) {
				console.log(error)
			}
		}
		return files
	},
	contactUpdate: LunaContactsApi.contactUpdate,
	anyCopy: async (props: { originalPath: string, destPath: string }) => {
		await cp(props.originalPath, props.destPath, { recursive: true, preserveTimestamps: true })
	},
	fileDangerouslyDelete: async (props: { filePath: string }) => {
		const file = await stat(props.filePath)
		if (!file.isFile()) return
		await rm(props.filePath)
	},
	contactCreate: async () => {
		const fileName = `${Math.random().toString(36).substring(7)}.vcf`
		const mainDir = "../data/Contacts"
		const filePath = `${mainDir}/${fileName}`
		const card = new Vcf()
		card.add('version', '4.0')
		card.add('n', ';New Contact;;;')
		await writeFile(filePath, card.toString())
		const contact = await LunaContactsApi.contactReadVcard({ filePath, originalDir: mainDir })
		return LunaContactsApi.contactToContactCompact(contact)
	},
}

export type {
	CompactContact,
	Contact, 
	VcfArrayItem
}
export type FioStat = (Stats & { name: string, type: { as: "shortcut", shortcut: Shortcut } | { as: "file" } | { as: "folder", fios: FioStat[] } | { as: "locked" } })
