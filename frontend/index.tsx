import { createMutable } from "solid-js/store"
import { batch, createSignal, For, lazy, onMount, Show, Switch, Match as SwitchMatch, } from "solid-js"
import A from "@arksouthern/jsx/ax"
import HandleSet from "@arksouthern/jsx/hx"
import Variables from "@arksouthern/jsx/vx"
import { apiRoot, createApi, getRoot } from "~/lib/url"
import { App } from "~/Types"
import { XpWindow } from "~/components/luna/window"
import { XpTitleButtons, XpTitleButtonsClose, XpTitleButtonsNormal } from "~/components/luna/title-buttons"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { mx, Mx } from "~/lib/mx"
import MatchAs from "@arksouthern/jsx/mx"
import VarSet from "@arksouthern/jsx/vx"
import { store, zIndex } from "~/Store"
import { Stats } from "fs"
import { api, CompactContact, Contact, FioStat } from "../backend"
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuGroupLabel, ContextMenuItem, ContextMenuPortal, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "~/components/ui/context-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card"
import { clipboardFsCopy, clipboardFsPaste, closeAppWindow, kbdShortcutOn, openApp, openFile, openFilePicker, queryFileOpener } from "~/lib/luna"
import { XpDropDownItem, XpDropDownMenu, XpDropDownTrigger } from "~/components/luna/dropdown-menu.tsx"
import { XpRightClickMenu, XpRightClickMenuDivider, XpRightClickMenuItem } from "~/components/luna/right-click-menu"
import { XpBarMenu, XpBarMenuCheckboxItem, XpBarMenuDivider, XpBarMenuItem, XpBarMenuLineItem, XpBarMenuMasterItem } from "~/components/luna/bar-menu"
import { createAbout } from "~/components/luna/about"
import { XpAsideAccordion, XpAsideAccordionItem } from "~/components/luna/side-accordian"
import { createFiosView, SortMx } from "~/components/luna/file-list-table-view-fios"
import { createSubWindow } from "~/components/luna/subwindow"
import { XpButton } from "~/components/luna/button"
import { XpTabContent, XpTabs } from "~/components/luna/tabs"
import { createDialog } from "~/components/luna/dialog"

const API = createApi<typeof api>("@arksouthern/luna.contacts")

type ViewSidebarMx = { as: "prompts" } | { as: "tree" } | { as: "none" }

export default function ProgFileExplorer(props: App) {

  const pathFirstLoad = () => {
    return "../data/Contacts/"
    // if (!props.app.params.openPath) return "../data/Contacts/"
    // if (props.app.params.openPath.endsWith("/")) return props.app.params.openPath
    // return `${props.app.params.openPath}/`
  }

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "")
    if (!digits) return ""
    const last4 = digits.slice(-4);
    const sub3  = digits.slice(-7, -4);
    const area3 = digits.slice(-10, -7);
    const country = digits.slice(0, -10) || "";
    return `+${country || 1} (${area3 || "---"}) ${sub3}-${last4}`
  }
  const sortAlphabet = (k: string) => (a: any, b: any) => a[k].localeCompare(b[k])
  const [storeSelf, XpFileFiosView] = createFiosView<CompactContact>({
    pathFirstLoad,
    updateDirThenCurrentFiles,
    overrideColumns: [
      { header: "Name", accessorKey: 'fullName', minWidth: 120, sorter: sortAlphabet('fullName') },
      {header: "Group", accessorKey: 'subDir', minWidth: 60, sorter: sortAlphabet('subDir') },
      { header: "E-Mail Address", accessorKey: 'emails', minWidth: 140, sorter: (a, b) => (a.emails?.find(e => e.type?.includes('pref'))?.address || a.emails?.[0]?.address || '').localeCompare(b.emails?.find(e => e.type?.includes('pref'))?.address || b.emails?.[0]?.address || ''), cell: (info) => info.emails?.find(e => e.type?.includes?.('pref'))?.address || info.emails?.[0]?.address || '' },
      { header: "Company", accessorKey: 'company', minWidth: 110, sorter: sortAlphabet('company') },
      { header: "Job Title", accessorKey: 'title', minWidth: 70, sorter: sortAlphabet('title') },
      { header: "Mobile", accessorKey: 'homeMobile', minWidth: 110, cell: (a, b) => formatPhone(a.homeMobile || a.homePhone || a.businessPhone) },
      { header: "Sur Name", accessorKey: 'lName', minWidth: 60, sorter: sortAlphabet('lName') },
      { header: "Notes", accessorKey: 'notes', sorter: sortAlphabet('notes') },
      // {header: "E-Mail Address", accessorKey: 'email'},
    ]
  })

  props.app.sizeX = 42
  props.app.sizeY = 28

  const self = createMutable({
    isViewStatusBar: true,
    isViewAddressBar: false,
    isViewButtonsBar: true,

    networkTreeDir: [] as Awaited<ReturnType<typeof API['dirList']>>,

    viewSidebarMx: { as: "prompts" } as ViewSidebarMx,

  })

  async function updateDirThenCurrentFiles(props: { dir: string }) {
    const items = await API.folderRead(props)
    batch(() => {
      storeSelf.selectedItems.splice(0)
      storeSelf.dir = props.dir
      storeSelf.networkDirCurrentFiles = items
    })
  }

  onMount(async () => {
    if (!storeSelf.dir) return

    updateDirThenCurrentFiles({ dir: storeSelf.dir })
    self.networkTreeDir = await API.dirList({ path: `${storeSelf.dir}ignore` })
  })

  function newPath(props: { path: string }) {
    return props.path.replaceAll("\\", "/")
  }

  function DirTree(props: { dirTree: Awaited<ReturnType<typeof API['dirList']>>, path: string }) {
    return (
      <>
        <ul class="text-[.62rem] flex-1 relative px-1 flex flex-col pl-[.8rem]">
          {/* <button class="absolute top-0.5 left-[17px] z-20 bg-[#f3f4f6] border-[#61646d] border w-3 h-3 scale-75"><span class="block -translate-y-1.5 ml-[1px]  text-sm">+</span></button> */}
          <For each={props.dirTree.filter(x => x.type.as == 'folder')}>{
            x => (
              <>
                <li
                  class="text-nowrap relative flex gap-1 items-center"
                >
                  <span onClick={async () => {
                    if (x.type.as != 'folder') return
                    if (x.type.fios.length)
                      x.type.fios = []
                    else
                      x.type.fios = await API.dirList({ path: `${props.path.split("/").slice(0, -1).join("/")}/${x.name}/ignore` })
                  }}>
                    <button class="absolute font-normal bg-[linear-gradient(135deg,#FFFFFF,#C1BAAC)] rounded-[1px] top-0.5 -left-[1rem] z-20 bg-[#f3f4f6] border-[#7F97B2] border w-2.5 h-2.5 scale-75">
                      {x.type.as == 'folder' && x.type.fios.length
                        ?
                        <span class="block leading-[1.2rem] -translate-y-1.5 ml-[0.5px]  text-[.62rem]">-</span>
                        :
                        <span class="block leading-[1.2rem] -translate-y-1.5 ml-[0.5px]  text-[.62rem]">+</span>
                      }
                    </button>

                    {x.type.as == 'folder' && x.type.fios.length
                      ?
                      <img class="h-4 w-4 min-w-4" src="/src/assets/shell32/5.ico" />
                      :
                      <img class="h-4 w-4 min-w-4" src="/src/assets/shell32/4.ico" />
                    }
                  </span>
                  <span
                    class="hover:text-[#00007B] hover:underline"
                    onClick={async () => {
                      if (x.type.as != 'folder') return
                      if (x.type.fios.length) {
                        x.type.fios = []
                      }
                      else {
                        x.type.fios = await API.dirList({ path: `${props.path.split("/").slice(0, -1).join("/")}/${x.name}/ignore` })
                        const dir = `${props.path.split("/").slice(0, -1).join("/")}/${x.name}/`
                        updateDirThenCurrentFiles({ dir })
                      }
                    }}>
                    {x.name}
                  </span>
                </li>
                {x.type.as == 'folder' && x.type.fios.length &&
                  <A.SubTree>
                    {x.type.as == 'folder' &&
                      <DirTree dirTree={x.type.fios} path={`${newPath(props).split("/").slice(0, -1).join("/")}/${x.name}/ignore`} />
                    }
                  </A.SubTree>
                }
              </>
            )
          }</For>
        </ul>
      </>
    )
  }

  function createContactPropertiesSubWindow(createProps: { contactIdx: number }) {
    // self.currentOpenConvos.push({ as: "single", to: user.id })
    // const openConvo = self.currentOpenConvos.at(-1)!
    const contact = createMutable(storeSelf.networkDirCurrentFiles[createProps.contactIdx])
    if (contact.email && !contact.emails) {
      contact.emails = [{ address: contact.email as any as string }]
    }
    if (!Array.isArray(contact.emails)) {
      contact.emails = []
    }
    if (!Array.isArray(contact.children)) {
      contact.children = []
    }
    const [SubWindow, appSubWindow] = createSubWindow({ app: props.app, offsetX: 2, offsetY: 2, sizeX: 33, sizeY: 25 })
    const [newEmail, setNewEmail] = createSignal("")
    const [selectedEmail, setSelectedEmail] = createSignal(-1)
    const [newChild, setNewChild] = createSignal("")
    const [selectedChild, setSelectedChild] = createSignal(-1)
    void (
      <SubWindow
        buttons={
          <XpTitleButtonsNormal app={appSubWindow} />
        }
        title={
          <>
            {/* <img class="ml-[.062rem] mr-1 w-3.5 h-3.5" src="/" /> */}
            <A.TitleText class="flex-1 pointer-events-none pr-1 tracking-[.032rem] overflow-hidden whitespace-nowrap text-ellipsis">
              Properties: {contact.fullName}
            </A.TitleText>
          </>
        }
        children={(
          <div class="bg-[#EBE9DA] flex-1 h-full flex flex-col">
            <A.MainContent class="p-1.5 pt-0 flex-1 flex flex-col">
              <XpTabs class="h-full" tabs={"Summary,Name,Home,Business,Personal,Other".split(",").map(x => ({ name: x }))}>
                <div class="h-[calc(100%_-_2.5rem)] flex flex-col">
                  <XpTabContent value="Summary">
                    <A.TabDesc class="h-12 flex items-center gap-3">
                      <img class="w-8 h-8" src="/src/assets/vs0710/Objects2012/ico_format/WinXP/propertiesORoptions.ico" />
                      <p>
                        Summary of information about this contact
                      </p>
                    </A.TabDesc>
                    <A.BorderX class="bg-[#ABA89B] h-px mb-4" />
                    <A.PhotoPlusSummary class="flex gap-2">
                      <A.Photo>
                        <A.Memory 
                          onDblClick={async () => {
                            const [newProfilePhoto] = await openFilePicker({exts: [".jpg", ".jpeg"]})
                            const response = await fetch(`${getRoot()}/read-media/jpg?url=${encodeURIComponent(newProfilePhoto)}`)
                            const blob = await response.blob()
                            const base64 = await new Promise((resolve, reject) => {
                              const reader = new FileReader() // @ts-ignore
                              reader.onloadend = () => resolve(reader.result.split(",")[1]); // remove "data:*/*;base64,"
                              reader.onerror = reject
                              reader.readAsDataURL(blob)
                            })
                            contact.photo = base64 as string
                          }}
                          class="cursor-pointer m-auto w-32 h-32 border border-t-[#ABA89B] border-l-[#ABA89B] border-b-white border-r-white">
                          <A.Inner class="flex h-full w-full border border-t-[#716F65] border-l-[#716F65] border-b-[#F1EFE3] border-r-[#F1EFE3]">
                            {contact.photo && (
                              <img src={`data:image/jpeg;base64,${contact.photo}`} class="h-full w-full object-contain" />
                            )}
                          </A.Inner>
                        </A.Memory>
                      </A.Photo>
                      <A.SummaryInfo class="flex flex-col gap-1">
                        <For each={"Name|fullName,E-Mail Address|emails,Home Phone|homePhone,Mobile|homeMobile,Job Title|title,Department|department,Office|office,Company Name|company,IRC Messenger|imppIrc".split(",").map(x => x.split("|"))}>
                          {([header, accessorKey]) => (
                            <div class="flex gap-3">
                              <span class="w-28 text-right">{header}:</span>
                              <span class="flex-1">
                                {
                                  accessorKey === 'emails'
                                    ? contact.emails?.find(e => e.type?.includes('pref'))?.address || contact.emails?.[0]?.address || ''
                                    : contact[accessorKey]
                                }
                              </span>
                            </div>
                          )}
                        </For>
                      </A.SummaryInfo>
                    </A.PhotoPlusSummary>
                  </XpTabContent>

                  <XpTabContent value="Name">
                    <A.TabDesc class="h-12 flex items-center gap-3">
                      <img class="w-8 h-8" src="/src/assets/vs0710/Objects2012/ico_format/WinXP/user.ico" />
                      <p>
                        Enter name and e-mail information about this contact here.
                      </p>
                    </A.TabDesc>
                    <A.BorderX class="bg-[#ABA89B] h-px mb-4" />
                    <A.SummaryInfo class="flex flex-col gap-1.5">
                      <A.RowName class="grid grid-cols-[1fr_1fr_6.5rem] gap-1.5">
                        <div class="flex items-center">
                          <span class="flex-1">First:</span>
                          <A.InputContainer class="w-20 h-6 border border-[#859CB6] bg-white">
                            <input class="w-full h-full pl-1 !outline-none" value={contact.fName} onInput={e => contact.fName = e.currentTarget.value} />
                          </A.InputContainer>
                        </div>
                        <div class="flex items-center gap-1">
                          <div class="flex items-center">
                            <span class="flex-1 w-16">Middle:</span>
                            <A.InputContainer class="w-20 h-6 border border-[#859CB6] bg-white">
                              <input class="w-full h-full pl-1 !outline-none" value={contact.mName} onInput={e => contact.mName = e.currentTarget.value} />
                            </A.InputContainer>
                          </div>
                          <span class="w-16">Last:</span>
                        </div>
                        <div class="flex">
                          <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                            <input class="w-full h-full pl-1 !outline-none" value={contact.lName} onInput={e => contact.lName = e.currentTarget.value} />
                          </A.InputContainer>
                        </div>
                      </A.RowName>
                      
                      <A.RowSecondLine class="grid grid-cols-[1fr_1fr_6.5rem] gap-1.5">
                        <div class="flex items-center">
                          <span class="flex-1">Title:</span>
                          <A.InputContainer class="w-20 h-6 border border-[#859CB6] bg-white">
                            <input class="w-full h-full pl-1 !outline-none" value={contact.title} onInput={e => contact.title = e.currentTarget.value} />
                          </A.InputContainer>
                        </div>
                        <div class="flex items-center gap-1">
                          <div class="flex items-center">
                            <span class="flex-1 w-16">Display:</span>
                            <A.InputContainer class="w-20 h-6 border border-[#859CB6] bg-white">
                              <input disabled class="w-full h-full pl-1 !outline-none" value={contact.fullName} />
                            </A.InputContainer>
                          </div>
                          <span class="w-16">Nickname:</span>
                        </div>
                        <div class="flex">
                          <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                            <input class="w-full h-full pl-1 !outline-none" value={contact.nickname} onInput={e => contact.nickname = e.currentTarget.value} />
                          </A.InputContainer>
                        </div>
                      </A.RowSecondLine>
                      <A.SpaceY class="h-0" />
                      <A.RowEmailAdd></A.RowEmailAdd>
                      <A.RowTallEmailList class="grid grid-cols-[1fr_1fr_6.5rem] gap-1.5">
                        <div class="flex gap-1.5 col-span-2">
                          <span class="w-24">E-Mail Address:</span>
                          <A.InputContainer class="flex-1 h-6 border border-[#859CB6] bg-white">
                            <input class="w-full h-full pl-1 !outline-none" value={newEmail()} onInput={e => setNewEmail(e.currentTarget.value)} />
                          </A.InputContainer>
                        </div>
                        <div>
                          <XpButton class="px-2 w-full" onClick={() => {
                            if (!newEmail()) return
                            contact.emails.push({ type: "internet", address: newEmail() })
                            setNewEmail("")
                          }}>Add</XpButton>
                        </div>
                      </A.RowTallEmailList>
                      <A.RowEmailOptions class="flex gap-1.5">
                        <A.InputContainer class="flex-1 h-24 border border-[#859CB6] bg-white overflow-y-auto">
                          <For each={contact.emails}>
                            {(email, i) => (
                              <div
                                class="py-0 px-1 mx-1 data-[default=true]:font-semibold aria-selected:bg-[#3355ac] aria-selected:text-white"
                                data-default={email.type?.endsWith?.("pref")}
                                aria-selected={selectedEmail() === i()}
                                onClick={() => setSelectedEmail(i())}
                              >
                                {email.address} {email.type?.endsWith?.("pref") ? "(Default E-Mail)" : ""}
                              </div>
                            )}
                          </For>
                        </A.InputContainer>
                        <A.ButtonList class="flex flex-col gap-1 w-[6.5rem] pt-1">
                          <XpButton class="px-2 w-full" onClick={() => {
                            if (selectedEmail() === -1) return
                            const email = contact.emails[selectedEmail()]
                            if (!email) return
                            setNewEmail(email.address)
                            contact.emails.splice(selectedEmail(), 1)
                            setSelectedEmail(-1)
                          }}>Edit</XpButton>
                          <XpButton class="px-2 w-full" onClick={() => {
                            if (selectedEmail() === -1) return
                            contact.emails.splice(selectedEmail(), 1)
                            setSelectedEmail(-1)
                          }}>Remove</XpButton>
                          <XpButton class="px-2 w-full" onClick={() => {
                            if (selectedEmail() === -1) return

                            const currentDefault = contact.emails.find(e => e.type?.includes('pref'))
                            if (currentDefault) {
                              currentDefault.type = currentDefault.type?.replace('pref', '').replace(',,', ',').trim()
                              if (currentDefault.type?.endsWith(',')) currentDefault.type = currentDefault.type.slice(0, -1)
                            }

                            const newDefault = contact.emails[selectedEmail()]
                            if (newDefault) {
                              if (newDefault.type) {
                                newDefault.type = `${newDefault.type},pref`
                              } else {
                                newDefault.type = 'pref'
                              }
                            }
                            // visually move to top
                            const email = contact.emails.splice(selectedEmail(), 1)
                            contact.emails.unshift(email[0])
                            setSelectedEmail(0)

                          }}>Set as Default</XpButton>
                        </A.ButtonList>
                      </A.RowEmailOptions>
                    </A.SummaryInfo>
                  </XpTabContent>

                  <XpTabContent value="Home">
                    <A.TabDesc class="h-12 flex items-center gap-3">
                      <img class="w-8 h-8" src="/src/assets/vs0710/Objects2012/ico_format/WinXP/homenet.ico" />
                      <p>
                        Enter home-related information about this contact here.
                      </p>
                    </A.TabDesc>
                    <A.BorderX class="bg-[#ABA89B] h-px mb-4" />
                    <A.SummaryInfo class="grid grid-cols-[5fr_4fr] gap-3">
                      <A.ColFirst class="grid grid-cols-[1fr_9rem] gap-y-1.5 content-start">
                        <A.Title class="h-6 flex items-center">
                          <span class="">Street Address:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-[3.4rem] border border-[#859CB6] bg-white">
                          <textarea class="w-full h-full resize-none overflow-y-scroll pl-1 !outline-none" value={contact.homeStreetAddress} onInput={e => contact.homeStreetAddress = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">City:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.homeCity} onInput={e => contact.homeCity = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">State/Province:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.homeState} onInput={e => contact.homeState = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">Zip Code:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.homeZip} onInput={e => contact.homeZip = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">Country/Region:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.homeCountry} onInput={e => contact.homeCountry = e.currentTarget.value} />
                        </A.InputContainer>
                      </A.ColFirst>
                      <A.ColSecond class="grid grid-cols-[1fr_9rem] gap-y-1.5 content-start">
                        <A.Title class="h-6 flex items-center">
                          <span class="">Phone:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.homePhone} onInput={e => contact.homePhone = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">Fax:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.homeFax} onInput={e => contact.homeFax = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">Mobile:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.homeMobile} onInput={e => contact.homeMobile = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">IRC @:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.imppIrc} onInput={e => contact.imppIrc = e.currentTarget.value} />
                        </A.InputContainer>
                      </A.ColSecond>
                    </A.SummaryInfo>
                    <A.EndBar class="grid grid-cols-[calc(55.5%_-_10.15rem)_1fr] gap-3 mt-1.5">
                      <A.Title class="h-6 flex items-center">
                        <span class="">Web Page:</span>
                      </A.Title>
                      <A.Info class="flex gap-1.5">
                        <A.InputContainer class="flex-1 h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.homeWebPage} onInput={e => contact.homeWebPage = e.currentTarget.value} />
                        </A.InputContainer>
                        <XpButton class="px-4 min-w-0">Go</XpButton>
                      </A.Info>
                    </A.EndBar>
                  </XpTabContent>
                  <XpTabContent value="Business">
                    <A.TabDesc class="h-12 flex items-center gap-3">
                      <img class="w-8 h-8" src="/src/assets/vs0710/Objects2012/ico_format/WinXP/cab.ico" />
                      <p>
                        Enter business-related information about this contact here.
                      </p>
                    </A.TabDesc>
                    <A.BorderX class="bg-[#ABA89B] h-px mb-4" />
                    <A.SummaryInfo class="grid grid-cols-[5fr_4fr] gap-3">
                      <A.ColFirst class="grid grid-cols-[1fr_9rem] gap-y-1.5 content-start">
                        <A.Title class="h-6 flex items-center">
                          <span class="">Street Address:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-[3.4rem] border border-[#859CB6] bg-white">
                          <textarea class="w-full h-full resize-none overflow-y-scroll pl-1 !outline-none" value={contact.businessStreetAddress} onInput={e => contact.businessStreetAddress = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">City:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.businessCity} onInput={e => contact.businessCity = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">State/Province:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.businessState} onInput={e => contact.businessState = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">Zip Code:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.businessZip} onInput={e => contact.businessZip = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">Country/Region:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.businessCountry} onInput={e => contact.businessCountry = e.currentTarget.value} />
                        </A.InputContainer>
                      </A.ColFirst>
                      <A.ColSecond class="grid grid-cols-[1fr_9rem] gap-y-1.5 content-start">
                        <A.Title class="h-6 flex items-center">
                          <span class="">Company:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.company} onInput={e => contact.company = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">Job Title:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.title} onInput={e => contact.title = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">Dept.:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.department} onInput={e => contact.department = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">Office:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.office} onInput={e => contact.office = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">Phone:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.businessPhone} onInput={e => contact.businessPhone = e.currentTarget.value} />
                        </A.InputContainer>
                        <A.Title class="h-6 flex items-center">
                          <span class="">Fax:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.businessFax} onInput={e => contact.businessFax = e.currentTarget.value} />
                        </A.InputContainer>
                      </A.ColSecond>
                    </A.SummaryInfo>
                    <A.EndBar class="grid grid-cols-[calc(55.5%_-_10.15rem)_1fr] gap-3 mt-1.5">
                      <A.Title class="h-6 flex items-center">
                        <span class="">Web Page:</span>
                      </A.Title>
                      <A.Info class="flex gap-1.5">
                        <A.InputContainer class="flex-1 h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.businessWebPage} onInput={e => contact.businessWebPage = e.currentTarget.value} />
                        </A.InputContainer>
                        <XpButton class="px-4 min-w-0">Go</XpButton>
                      </A.Info>
                    </A.EndBar>
                  </XpTabContent>
                  <XpTabContent value="Personal">
                    <A.TabDesc class="h-12 flex items-center gap-3">
                      <img class="w-8 h-8" src="/src/assets/vs0710/Objects2012/ico_format/WinXP/users.ico" />
                      <p>
                        Enter personal information about this contact here.
                      </p>
                    </A.TabDesc>
                    <A.BorderX class="bg-[#ABA89B] h-px mb-4" />
                    <A.SummaryInfo class="flex flex-col gap-2">
                      {/* <A.Row class="grid grid-cols-[5rem_1fr_6.5rem] gap-2">
                        <A.Title class="h-6 flex items-center">
                          <span class="">Children:</span>
                        </A.Title>
                        <A.InputContainer class="flex-1 h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={newChild()} onInput={e => setNewChild(e.currentTarget.value)} />
                        </A.InputContainer>
                        <XpButton class="px-2 w-full" onClick={() => {
                          if (!newChild()) return
                          contact.children.push({ group: -1, value: newChild() })
                          setNewChild("")
                        }}>Add</XpButton>
                      </A.Row>
                      <A.Row class="grid grid-cols-[5rem_1fr_6.5rem] gap-2">
                        <div></div>
                        <A.InputContainer class="flex-1 h-10 border border-[#859CB6] bg-white overflow-y-auto">
                          <For each={contact.children}>
                            {(child, i) => (
                              <div
                                class="py-0 px-1 mx-1 aria-selected:bg-[#3355ac] aria-selected:text-white"
                                aria-selected={selectedChild() === i()}
                                onClick={() => setSelectedChild(i())}
                              >
                                {child.value}
                              </div>
                            )}
                          </For>
                        </A.InputContainer>
                        <A.ButtonList class="flex flex-col gap-1 w-full pt-0">
                          <XpButton class="px-2 w-full" onClick={() => {
                            if (selectedChild() === -1) return
                            const child = contact.children[selectedChild()]
                            if (!child) return
                            setNewChild(child.value)
                            contact.children.splice(selectedChild(), 1)
                            setSelectedChild(-1)
                          }}>Edit</XpButton>
                          <XpButton class="px-2 w-full" onClick={() => {
                            if (selectedChild() === -1) return
                            contact.children.splice(selectedChild(), 1)
                            setSelectedChild(-1)
                          }}>Remove</XpButton>
                        </A.ButtonList>
                      </A.Row> */}
                      <A.Row class="grid grid-cols-[5rem_1fr_5rem] gap-2">
                        <A.Title class="h-6 flex items-center">
                          <span class="">Gender:</span>
                        </A.Title>
                        <A.InputContainer class="w-3/5 h-6 border border-[#859CB6] bg-white">
                          <select class="w-full h-full pl-1 !outline-none" value={contact.gender} onInput={e => contact.gender = e.currentTarget.value}>
                            <option value="">Unspecified</option>
                            <option value="F">Female</option>
                            <option value="M">Male</option>
                          </select>
                        </A.InputContainer>
                        <div></div>
                      </A.Row>
                      <A.Row class="grid grid-cols-[5rem_1fr_5rem] gap-2">
                        <A.Title class="h-6 flex items-center">
                          <span class="">Birthday:</span>
                        </A.Title>
                        <A.InputContainer class="w-3/5 h-6 border border-[#859CB6] bg-white">
                          <input type="date" class="w-full h-full pl-1 !outline-none" value={contact.bDay} onInput={e => contact.bDay = e.currentTarget.value} />
                        </A.InputContainer>
                        <div></div>
                      </A.Row>
                      <A.Row class="grid grid-cols-[5rem_1fr_5rem] gap-2">
                        <A.Title class="h-6 flex items-center">
                          <span class="">Spouse:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-6 border border-[#859CB6] bg-white">
                          <input class="w-full h-full pl-1 !outline-none" value={contact.spouse?.[0]?.value || ''} onChange={e => {
                            const value = e.currentTarget.value
                            if (contact.spouse && contact.spouse?.[0])
                              contact.spouse[0].value = value
                            else
                              contact.spouse.push({group: -1, value})
                          }} />
                        </A.InputContainer>
                        <div></div>
                      </A.Row>
                      <A.Row class="grid grid-cols-[5rem_1fr_5rem] gap-2">
                        <A.Title class="h-6 flex items-center">
                          <span class="">Anniversary:</span>
                        </A.Title>
                        <A.InputContainer class="w-3/5 h-6 border border-[#859CB6] bg-white">
                          <input type="date" class="w-full h-full pl-1 !outline-none" value={contact.anniversary} onInput={e => contact.anniversary = e.currentTarget.value} />
                        </A.InputContainer>
                        <div></div>
                      </A.Row>
                    </A.SummaryInfo>
                  </XpTabContent>
                  <XpTabContent value="Other">
                    <A.TabDesc class="h-12 flex items-center gap-3">
                      <img class="w-8 h-8" src="/src/assets/vs0710/Objects2012/ico_format/WinXP/textdoc.ico" />
                      <p>
                        Additional information about this contact.
                      </p>
                    </A.TabDesc>
                    <A.BorderX class="bg-[#ABA89B] h-px mb-4" />
                    <A.SummaryInfo class="flex flex-col gap-1">
                        <A.Title class="h-6 flex items-center">
                          <span class="">Notes:</span>
                        </A.Title>
                        <A.InputContainer class="w-full h-24 border border-[#859CB6] bg-white">
                          <textarea class="w-full h-full pl-1 !outline-none" value={contact.notes} onInput={e => contact.notes = e.currentTarget.value} />
                        </A.InputContainer>
                    </A.SummaryInfo>
                  </XpTabContent>
                </div>
              </XpTabs>
            </A.MainContent>
            <A.BottomBar class="flex justify-end gap-1.5 p-1.5 pt-0">
              <XpButton class="px-2 min-w-0 w-20" onClick={async () => {
                await API.contactUpdate(contact)
                closeAppWindow(appSubWindow)
              }}>OK</XpButton>
              <XpButton class="px-2 min-w-0 w-20" onClick={() => closeAppWindow(appSubWindow)}>Cancel</XpButton>
            </A.BottomBar>
          </div>
        )}
      />
    )
  }

  const [About, setAbout] = createAbout({ app: props.app, offsetX: 4, offsetY: 2, sizeX: 30, sizeY: 18 })
  const [FindDialog, setFindDialog] = createDialog({ app: props.app, offsetX: 4, offsetY: 2, sizeX: 30, sizeY: 18 })

  // onMount(() => {
  //   if (props.app.params.openPath.endsWith(".vcf")) {
  //     createContactPropertiesSubWindow({})
  //   }
  // })

  return (
    <A.FileExplorer>
      <About progId="@arksouthern/luna.contacts" license={{as: "full", title: "MIT"}} icon={"/src/assets/xp-archive/wab_IDI_ICON_ABOOK.ico"} title={
        <>
          <A.TitleText class="flex-1 pointer-events-none pr-1 tracking-[.032rem] overflow-hidden whitespace-nowrap text-ellipsis">
            About Address Book
          </A.TitleText>
          <XpTitleButtons>
            <XpTitleButtonsClose {...props} onClick={() => setAbout.dialogHide()} />
          </XpTitleButtons>
        </>
      }>
        Replicating Microsoft's <small class="text-[0.75em]">&#174;</small> Address Book <br />
        Version 0.0.1 (Build 2025.11-15) <br />
        Arkansas Soft Construction, Inc. <br />
        <br />
      </About>
      <HandleSet
        handlers={{
          itemsCopy: async () => {
            const openPathList = storeSelf.selectedItems.map(id => `${storeSelf.dir}${storeSelf.networkDirCurrentFiles[id].name}`)
            await clipboardFsCopy({ openPathList })
          },
          itemsPaste: async () => {
            const result = await clipboardFsPaste({})
            if (result.as == "pasteFailed") return
            await Promise.all(
              result.openPathList.map(async (originalPath) => {
                await API.anyCopy({ originalPath, destPath: `${storeSelf.dir}${originalPath.split("/").pop()}` })
              })
            )
            updateDirThenCurrentFiles({ dir: storeSelf.dir })
          },
          favClick: (fav: FioStat) => async () => {
            storeSelf.selectedItems.splice(0)

            if (fav.type.as != "shortcut") return
            const { prog, params } = fav.type.shortcut
            if (prog == "@arksouthern/luna.explore")
              updateDirThenCurrentFiles({ dir: params.openPath })
            else
              openApp({ params, program: prog })
          },
          navDirUp: async () => {
            let dir = storeSelf.dir.split("/") as any
            dir = dir.slice(0, -2)
            dir = dir.join("/") + "/"
            updateDirThenCurrentFiles({ dir })
          },
          sortsFileListToggle: (as: SortMx['as']) => () => {
            const sIndex = storeSelf.sorts.findIndex((s) => s.as == as)
            const sort = storeSelf.sorts[sIndex]
            if (!sort) storeSelf.sorts.push({ as, direction: "up" })
            else if (sort.direction == "up") sort.direction = "down"
            else storeSelf.sorts.splice(sIndex, 1)
          },
          appClose: async () => {
            closeAppWindow(props)
          },
          displaySidebar: (as: ViewSidebarMx['as']) => () => {
            self.viewSidebarMx = self.viewSidebarMx.as == as
              ? { as: "prompts" }
              : { as }
          },
          displayStandardButtonsToggle: () => {
            self.isViewButtonsBar = !self.isViewButtonsBar
          },
          displayAddressBarToggle: () => {
            self.isViewAddressBar = !self.isViewAddressBar
          },
          displayStatusBarToggle: () => {
            self.isViewStatusBar = !self.isViewStatusBar
          },
          anySelect: (props: { file: FioStat, index: number }) => (e: any) => {
            if (!(e.ctrlKey || e.metaKey)) storeSelf.selectedItems.splice(0)
            if (storeSelf.selectedItems.includes(props.index)) {
              const j = store.selectedItems.findIndex((j) => j == props.index)
              storeSelf.selectedItems.splice(j, 1)
            } else {
              storeSelf.selectedItems.push(props.index)
            }
            console.log(storeSelf.selectedItems)
          },
          anySelectAll: () => {
            storeSelf.selectedItems = storeSelf.networkDirCurrentFiles.map((_, i) => i)
          },
          anySelectInvert: () => {
            storeSelf.selectedItems = storeSelf.networkDirCurrentFiles.map((_, i) => storeSelf.selectedItems.includes(i) ? -1 : i).filter(i => i > -1)
          },
          openSearch: () => {
            openApp({ program: "@arksouthern/luna.explore.find", params: { openPath: storeSelf.dir } })
          },
          openProperties: () => {
            if (storeSelf.selectedItems.length != 1) return
            createContactPropertiesSubWindow({ contactIdx: storeSelf.selectedItems[0] })
          },
          openInNotepad: () => {
            if (storeSelf.selectedItems.length != 1) return
            const file = storeSelf.networkDirCurrentFiles[storeSelf.selectedItems[0]]
            openApp({ program: "@arksouthern/luna.note", params: { openPath: file.type.fullPath } })
          },
          dangerouslyDeleteFile: async () => {
            await API.fileDangerouslyDelete({ filePath: `${storeSelf.networkDirCurrentFiles[storeSelf.selectedItems[0]].type.fullPath}` })
            await updateDirThenCurrentFiles({ dir: storeSelf.dir })
          }
        }}
      >
        {handlers => (
          <XpWindow {...props} buttons={<XpTitleButtonsNormal {...props} />} title={<>
            <img class="ml-[.062rem] mr-1 w-3.5 h-3.5" src="/src/assets/xp-archive/wab_IDI_ICON_ABOOK.ico" draggable="false" />
            <A.TitleText class="flex-1 pointer-events-none pr-1 tracking-[.032rem] overflow-hidden whitespace-nowrap text-ellipsis">
              {(storeSelf.dir?.replace("../data/Contacts", "Address Book") || "Address Book ").replaceAll("/", "\\").slice(0, -1).replaceAll("\\", " \\ ")}
            </A.TitleText>
          </>}>
            {kbdShortcutOn({ app: props, keys: ["Ctrl", "A"], callback: handlers.anySelectAll })}
            {kbdShortcutOn({ app: props, keys: ["Ctrl", "C"], callback: handlers.itemsCopy })}
            {kbdShortcutOn({ app: props, keys: ["Ctrl", "K"], callback: handlers.displaySidebar('tree') })}
            {kbdShortcutOn({ app: props, keys: ["Ctrl", "L"], callback: handlers.displaySidebar('none') })}
            {kbdShortcutOn({ app: props, keys: ["Ctrl", "V"], callback: handlers.itemsPaste })}
            <A.Toolbars style={{ background: `linear-gradient(to right, #F2F4F2 0%, #ECE8D0 100%)` }}>
              <A.AltBar class="relative h-5 mt-0.5 ml-0.5 mb-0.5 text-xs">
                <XpBarMenu>
                  <XpBarMenuItem name="File">
                    {/* <XpBarMenuLineItem>TODO Open Command Prompt</XpBarMenuLineItem> */}
                    {/* <XpBarMenuDivider /> */}
                    <XpBarMenuLineItem onClick={async () => {
                      const newContact = await API.contactCreate()
                      storeSelf.networkDirCurrentFiles.push(newContact)
                      createContactPropertiesSubWindow({ contactIdx: storeSelf.networkDirCurrentFiles.length - 1 })
                    }}>New</XpBarMenuLineItem>
                    <XpBarMenuDivider />
                    <XpBarMenuMasterItem
                      onClick={handlers.dangerouslyDeleteFile}
                      title="Delete"
                      disabled={storeSelf.selectedItems.length != 1}
                    />
                    <XpBarMenuMasterItem
                      onClick={handlers.openProperties}
                      disabled={(storeSelf.selectedItems.length != 1) as true}
                      title="Properties"
                    />
                    <XpBarMenuDivider />
                    <XpBarMenuLineItem onClick={handlers.appClose}>Close</XpBarMenuLineItem>
                  </XpBarMenuItem>
                  <XpBarMenuItem name="Edit">
                    <XpBarMenuLineItem disabled shortcut="Ctrl+Z">TODO Undo</XpBarMenuLineItem>
                    <XpBarMenuDivider />
                    <XpBarMenuLineItem disabled shortcut="Ctrl+X">TODO Cut</XpBarMenuLineItem>
                    <XpBarMenuLineItem disabled={!storeSelf.selectedItems.length as true} onClick={handlers.itemsCopy} shortcut="Ctrl+C">Copy</XpBarMenuLineItem>
                    <XpBarMenuLineItem onClick={handlers.itemsPaste} shortcut="Ctrl+V">Paste</XpBarMenuLineItem>
                    {/* <XpBarMenuLineItem disabled>TODO Paste Shortcut</XpBarMenuLineItem>
                    <XpBarMenuDivider />
                    <XpBarMenuLineItem disabled>TODO Copy To Folder...</XpBarMenuLineItem>
                    <XpBarMenuLineItem disabled>TODO Move To Folder...</XpBarMenuLineItem> */}
                    <XpBarMenuDivider />
                    <XpBarMenuLineItem
                      onClick={handlers.anySelectAll}
                      shortcut="Ctrl+A"
                    >Select All</XpBarMenuLineItem>
                    <XpBarMenuLineItem
                      onClick={handlers.anySelectInvert}
                    >Invert Selection</XpBarMenuLineItem>
                  </XpBarMenuItem>
                  <XpBarMenuItem name="View">
                    <XpBarMenuMasterItem
                      title="Toolbars"
                      xpBarMenuItemMasterList={<>
                        <XpBarMenuMasterItem
                          title="Standard Buttons"
                          indicator={self.isViewButtonsBar ? "checked" : undefined}
                          onClick={handlers.displayStandardButtonsToggle}
                        />
                        <XpBarMenuMasterItem
                          title="Address Bar"
                          indicator={self.isViewAddressBar ? "checked" : undefined}
                          onClick={handlers.displayAddressBarToggle}
                        />
                        <XpBarMenuDivider />
                        <XpBarMenuMasterItem
                          title="Lock the Toolbars"
                          indicator="checked"
                          disabled
                        />
                        <XpBarMenuMasterItem
                          title="Customize..."
                          disabled
                        />
                      </>}
                    />
                    <XpBarMenuCheckboxItem
                      boolean={self.isViewStatusBar}
                      onClick={handlers.displayStatusBarToggle}
                    >
                      Status Bar
                    </XpBarMenuCheckboxItem>

                    <XpBarMenuMasterItem
                      title="Explorer Bar"
                      xpBarMenuItemMasterList={<>
                        <XpBarMenuMasterItem
                          title="Search"
                          shortcut="Ctrl+E"
                          disabled
                        />
                        <XpBarMenuMasterItem
                          title="Folders"
                          indicator={self.viewSidebarMx.as == "tree" ? "checked" : undefined}
                          shortcut="Ctrl+K"
                          onClick={handlers.displaySidebar('tree')}
                        />
                        <XpBarMenuDivider />
                        <XpBarMenuMasterItem
                          title="Hidden"
                          shortcut="Ctrl+L"
                          indicator={self.viewSidebarMx.as == "none" ? "checked" : undefined}
                          onClick={handlers.displaySidebar('none')}
                        />
                      </>}
                    />
                    <XpBarMenuDivider />
                    <XpBarMenuMasterItem
                      title="Thumbnails"
                      disabled
                    />
                    <XpBarMenuMasterItem
                      title="Tiles"
                      disabled
                    />
                    <XpBarMenuMasterItem
                      title="Icons"
                      indicator={storeSelf.viewIconListMx.as == "icons" ? "radio" : undefined}
                      onClick={() => storeSelf.viewIconListMx.as = "icons"}
                    />
                    <XpBarMenuMasterItem
                      title="List"
                      indicator={storeSelf.viewIconListMx.as == "list" ? "radio" : undefined}
                      onClick={() => storeSelf.viewIconListMx.as = "list"}
                    />
                    <XpBarMenuMasterItem
                      title="Details"
                      indicator={storeSelf.viewIconListMx.as == "details" ? "radio" : undefined}
                      onClick={() => storeSelf.viewIconListMx.as = "details"}
                    />
                    <XpBarMenuDivider />
                    <XpBarMenuMasterItem title="Arrange Icons by" xpBarMenuItemMasterList={<>
                      <XpBarMenuMasterItem title="Name" onClick={handlers.sortsFileListToggle("name")} indicator={storeSelf.sorts.find(x => x.as == "name") ? "checked" : undefined} />
                      <XpBarMenuMasterItem title="Size" onClick={handlers.sortsFileListToggle("size")} indicator={storeSelf.sorts.find(x => x.as == "size") ? "checked" : undefined} />
                      <XpBarMenuMasterItem title="Date Modified" onClick={handlers.sortsFileListToggle("dateModified")} indicator={storeSelf.sorts.find(x => x.as == "dateModified") ? "checked" : undefined} />
                      <XpBarMenuMasterItem title="Date Created" onClick={handlers.sortsFileListToggle("dateCreated")} indicator={storeSelf.sorts.find(x => x.as == "dateCreated") ? "checked" : undefined} />
                      {/* <XpBarMenuMasterItem title="Type" />   */}
                      <XpBarMenuDivider />
                      <XpBarMenuMasterItem disabled title="TODO Show in Groups" />
                      <XpBarMenuMasterItem disabled title="Auto Arrange" />
                      <XpBarMenuMasterItem disabled title="Align to Grid" />
                    </>} />
                    <XpBarMenuDivider />
                    <XpBarMenuLineItem onClick={() => updateDirThenCurrentFiles({ dir: storeSelf.dir })}>Refresh</XpBarMenuLineItem>
                  </XpBarMenuItem>
                  {/* <XpBarMenuItem name="Favorites">
                    <XpBarMenuLineItem disabled>TODO Add To Favorites...</XpBarMenuLineItem>
                    <XpBarMenuLineItem disabled>Organize Favorites...</XpBarMenuLineItem>
                    <XpBarMenuDivider />
                    <For each={self.networkFavoritesFiles}>
                      {fav => (
                        <>
                          {fav.type.as != "shortcut" ? "" : (
                            <XpBarMenuMasterItem
                              title={fav.name.replaceAll(".xp.json", "")}
                              icon={
                                <img
                                  src={fav.type.shortcut.icon || getFileIconImg({ file: { name: fav.type.shortcut.params.openPath } })}
                                />
                              }
                              onClick={handlers.favClick(fav)}
                            />
                          )}
                        </>
                      )}
                    </For>
                  </XpBarMenuItem> */}
                  <XpBarMenuItem name="Help">
                    <XpBarMenuLineItem disabled>Help Topics</XpBarMenuLineItem>
                    <XpBarMenuDivider />
                    <XpBarMenuLineItem onClick={setAbout.dialogShow}>About Address Book</XpBarMenuLineItem>
                  </XpBarMenuItem>
                </XpBarMenu>
              </A.AltBar>
              <A.BorderY class="border-y border-t-[#D7D2BF] border-b-white h-0" />
              <Show when={self.isViewButtonsBar}>
                <A.FunctionBar class="h-9 flex items-center text-xs px-1">
                  <A.NavFunctions class="flex items-center">
                    <button
                      disabled={storeSelf.dir == "../data/Contacts/"}
                      class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD] px-0.5 py-1.5"
                      onClick={handlers.navDirUp}>
                      <img class="w-[1.375rem] h-[1.375rem]" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAEwElEQVR42tWVe0zVdRiHrdZqy2U4aWJeADcZKoiAQ7JNVhKCCpShoPBHpqkT81ZaIiBOBT0mKghCipCEIBOKg0cOh4tcBA6XuESAwDmHw+FyRAVFEbmdp5/mbKzEa1t9t+ff99n7fj9731Gj/qvPK2olZvtnIpIe5F+T7Ez+lnf2jGZMyBuMCxiDQ4j9y5eFZYZicXQm+hFvYZSgh1nSeExO6WOwUx/f5F0vT+h2+lPGBQuSeD3Mfx7P3NSJfCydir3YGOtwQ+aJbPgxL0b5QpKNcd5MCTbAMPZPie2FSTjIpuKSbYJX4Sw8c8xZlGSKbegMNsavf77uQjNCsA6xYPIPesxIfBfr5Al8lGaE60PJ6mJL3NKnYx3xHob79JjsY8CycDfE5WK7EQu3yn24T8tDPjlkjb7PWKYdMsQmbBaWYdOYGzsRzwJz1pRY8aXABzHGhOYfJK44uj06/yRJxecCRpS0FPnQJt9OV/1xbjZGclMRTGzGDvbHuxOa+h0x+afZkrAO88Nj8cg2Y22pNd6VtliGT3m2cTWlOdJzTcLQQAY6XQ4gob83ixuN0bRXHKO9KhyxbBNuJ01xFps+kGytnf/sIk2mCwzKBEHEX+jiudeVQGfdLq6WraChYhVRRStxSjZlW50dOxoXYHXCkMKSYLS1cXH3ebIoywmGooTiJ4YzdFrgFLqhMPp7ROTWrMJRSNl9iV/zIqxPGJErcUWT5Ulr3jrUBdvQ1id99VhRs8we7oUJHPsbQ71H6OvaK/zfBi6kObDw/HT8NYsJaHMREmdEZX0idzqK6bujoblgC8r8rY8fp0piBx3HBfYypA1goM2XgdZdD7ir2EJHyXKuVflRpE5mScosAtpdONC1XBidMVc6KoRR3+W2Ng9llheqIr9/Ft1Up+opU2zQNR1Ap9xJV8kK1NL3UUmsHmLJ9ep9QlCqKG4LwkU8W5C4I7rlgZXIhCtXc4QAtaDKWoZa7j9yOBqTLNDV+NIj90RT4E1vl5zBvjKBHAGpIBELxZIfiYI63fn88nx2/OREW2e68H85KGQLURfvf7yI0ojX6xNMGCzfSqt4Dt2t6Qz2JwrjOCMQIyAEglM0dQRxJOszXFNns0e7HLPvJ1FWupl7d6WoLrkK3fg+Oeq1cYb0lnijTJlH3+0idP3RMHB8GNLfvFkab8X2BmcWn7dk9y9OdCn8GOw5S7N8LdorSWtGlID/q7/HGtBdtJ6Wwq8ZvC2BnnCB4EeoW/wRyVyZF2XCslQbYUvMR6n2YUC9G02uI5rywCd3I8zllcpoPa7letGtSWOoMxI6RQJBj0iXr8ZF2NC2h40JFC+krMob3Y1ABhq2UXN2AprqpzgTcO618qjRaGTODHTXoGsLhNbdw8jI82JTpCWiM3Mov+TM9ZKltF92pDXTnsZ0t6dfQ79GvU1Tpjt05YHSj6GGb+ir3UhP5RfcKvWgSvoh2Uk2KDIcUGcsoTFtMfVSNxoubQBV9ptPLao4MwFtpYie2r3cknvQmeeMNtuJZpkjCskC6sR21ElcUORtRlMRSltjiuNzHbnK2Ml01ESiuriAWiFR1YkW1F1ciqrQl9bqFzzTwzuaSGWcCc3lR9EqLpiN+j++PwBbsefO+2FUcAAAAABJRU5ErkJggg==" alt="" />
                      {/* <img class="w-7 h-7 -mx-[.062rem] -rotate-90" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEqElEQVR42u2WeUzbZRjH94NKuYqlbGWL0woMcDDa4tS5TPFCExA6HB6TsUyF6caxSyIIsgN0mzqUXbaBjADVVojjWCmUGwqdHIGBoxMcBUZR8EA3sxHdIl/fX6EFEtSC7A8NT/KkTZv8Pp/neZ/f+75LlizGYvzXQjuqReKlRPhp/MBWskEVU7A4S0GoEkBUGwzxJQn0vwzhtoDD28PhUOmAoOZAxHVGI1X7FsTd+5HSEYHIxifwZJkruJ/bwlHKRlJz4sJJyAblYFexEXbhZaiGFSjVy5HXdxyZ3e/gWGckDrZuxD7NesSoBYbcVL4K3CxbCOUCDP3bboj7JHCocIC4/xQqvy1A4UAmsr9JwfGLsdjX+DASmp5CatuLJvj09MrlwDeXSIzOU0IzogFVQiFDdwKKwVzIeo9B8nU8jl7YZoArr4jRNFKMQ60i7G8Jml0iiwM/6aPzE+DX8PF6Wzi+6P8EWT2H8PHFnQQWaoCnd0bAGGO3fsUR0oU4zYZZJZzTbCHvkM1NQnxZDK7SCdLLR3Ba+yYOt2/B21/6I1YtJALrcKAlANPDKLGrwXcG/I36NQgs4oGTwoZ+VG++hKCcj1fPB5mGbC+pmn4gXX2segIi7UmeVYL+b2e9D16p88LW2vuwudodnHeZkDSKzRPQXx2CRR6FxBaRYciM1dBwowDdiX+SCKi8B89W8hBS5QKfTA42ZgSbJ1A6UArnfHvsbnjA8KAD7WE423+CvAGnUEySHr7pqb/e/ZcSfqoV8FfdhYdkXAgP880XuDuPZapcqvsIcw1a4mBrCEKr3bChzBlrC5aCEUOZKdBHBGRTAtnk9ZtLjI+PY+hGP4JrvLFG6QihkgN+kSMYkeYK6IhAzpRATMsmnOn9EDm9acglKSVCMl0a8nTpKOg/ibYfq2YI0PCQWh94lzjCo8SBfLLhls2C0w62eQJd32thcZKa9Z2ennsb1hmG8gZptzFGxvQIrRUaKncncE+StIRzujUeS57DhuSSycNmlccMYLSaj+j6iaTfgj0ND+L6rWumto+MDSG0bgpOg90U9nBR2IGVwEBSTrz5AjGqKHid4UyCBdhBNpSoSTj92y71/fjpt2FT5cOkclEtH97kiKbhdLoS+MpztuDmM8F4jkKXrsN8ga7vOsH5gI0XlO7YXudtqnxikxHgva/24OYfNyfXfADPVK/GarLWniV3YpWChXvP2WF5sTWWFTFhF2+Jre+Hzf08SKxIwNKjNnip0h2vkV0tgmRolSu8CMi/RoCea1pc/f1nBJLvNNjT0HIWVhbbgEvAnMI7YENmiSNio6u3Y34HUrh8C5xSmAgoJbtaBQ+PlC0na2pvWFsa6EMm3bjmdMtXFNFVW4FVYAkbCQXLpynIyz+d/51g8IcBiDKC4JhshbX5y7CebCq+5JCiwfRwGYfMWDW7kAE7ckVjJk/AJQWnF+ZmlFSYAKc4Nrip1vD4bOaQOROwU6EV7OUWYKZSYARRcHmeB02HemHvhl1XOhGbEwXX3TxYhVvANsYS1ttJRlqCEUYqfpxcTrfxF67qv4vzWjXKmhUoa5rIUo0CgyMDtx+8GP+7+BOtKFbTGHQVFwAAAABJRU5ErkJggg==" alt="" /> */}
                    </button>
                    <A.Divider class='h-7 w-[.062rem] bg-black/25 mx-0.5'></A.Divider>
                    <button
                      aria-selected={self.viewSidebarMx.as == "prompts"}
                      onClick={handlers.displaySidebar('prompts')}
                      class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 aria-selected:border-[#8097AD] aria-selected:bg-white hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD]"
                    >
                      <img
                        class="w-7 h-7 p-0.5 -mx-[.062rem]"
                        src="/src/assets/vs0710/Objects2012/png_format/Office and VS/base_business_contacts.png"
                        alt=""
                      />
                      <span class="mr-1">Preview</span>
                    </button>
                    <button
                      aria-selected={self.viewSidebarMx.as == "tree"}
                      onClick={handlers.displaySidebar('tree')}
                      class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 aria-selected:border-[#8097AD] aria-selected:bg-white hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD]"
                    >
                      <img
                        class="w-7 h-7 p-0.5 -mx-[.062rem]"
                        src="/src/assets/ico/35.ico"
                        alt=""
                      />
                      <span class="mr-1">Folders</span>
                    </button>
                    {/* <button
                      aria-selected={self.viewSidebarMx.as == "favorites"}
                      onClick={handlers.displaySidebar('favorites')}
                      class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 aria-selected:border-[#8097AD] aria-selected:bg-white hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD]"
                    >
                      <img
                        class="w-7 h-7 p-0.5 -mx-[.062rem]"
                        src="/src/assets/shell32/44.ico"
                        alt=""
                      />
                      <span class="mr-1">Favorites</span>
                    </button> */}
                    <A.Divider class='h-7 w-[.062rem] bg-black/25 mx-0.5'></A.Divider>

                    <button
                      onClick={setFindDialog.dialogShow}
                      disabled
                      class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD]"
                    >
                      <img
                        class="w-6 h-6 mx-[.062rem]"
                        src="/src/assets/vs0710/Actions2010/ico_format/WinXP/search4people.ico"
                        alt=""
                      />
                      <span class="mr-1">Find</span>
                    </button>
                    <button
                      onClick={async () => {
                        const newContact = await API.contactCreate()
                        storeSelf.networkDirCurrentFiles.push(newContact)
                        createContactPropertiesSubWindow({ contactIdx: storeSelf.networkDirCurrentFiles.length - 1 })
                      }}
                      class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD]"
                    >
                      <img
                        class="w-6 h-6 -mx-[.062rem]"
                        src="/src/assets/vs0710/Objects2012/ico_format/WinXP/user.ico"
                        alt=""
                      />
                      <span class="mr-1">New</span>
                    </button>
                    <A.Divider class='h-7 w-[.062rem] bg-black/25 mx-0.5'></A.Divider>
                    <button
                      onClick={handlers.openProperties}
                      disabled={storeSelf.selectedItems.length != 1}
                      class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD]"
                    >
                      <img
                        class="w-6 h-6 -mx-[.062rem]"
                        src="/src/assets/vs0710/Objects2012/ico_format/WinXP/propertiesORoptions.ico"
                        alt=""
                      />
                      <span class="mr-1">Properties</span>
                    </button>
                    <button
                      onClick={handlers.dangerouslyDeleteFile}
                      disabled={storeSelf.selectedItems.length != 1}
                      class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD]"
                    >
                      <img
                        class="w-6 h-6 -mx-[.062rem]"
                        src="/src/assets/ico/848.ico"
                        alt=""
                      />
                      <span class="mr-1">Delete</span>
                    </button>
                    <A.Divider class='h-7 w-[.062rem] bg-black/25 mx-0.5'></A.Divider>
                    <XpDropDownMenu
                      placement='bottom-start'
                      xpDropDownTrigger={(
                        <XpDropDownTrigger disabled={!storeSelf.dir}>
                          <button
                            disabled={!storeSelf.dir}
                            class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD] pl-1 pr-0.5 py-1.5"
                          >
                            <img class="w-5 h-5 -mx-[.062rem]" src="/src/assets/ico/160.ico" alt="" />
                            <div class="h-full flex items-center mx-1 before:border-x-transparent before:border-y-black before:border-[3px] before:border-b-0" />
                          </button>
                        </XpDropDownTrigger>
                      )}
                      xpDropDownItemList={<>
                        <For each={["details", "icons", "list"] as const}>
                          {x => (
                            <XpDropDownItem
                              title={<span class="capitalize">{x}</span>}
                              indicator={storeSelf.viewIconListMx.as == x ? "radio" : undefined}
                              onClick={() => storeSelf.viewIconListMx.as = x}
                            />
                          )}
                        </For>
                      </>}
                    />
                  </A.NavFunctions>
                </A.FunctionBar>
                <A.BorderY class="h-0 border-y border-t-[#D7D2BF] border-b-white" />
              </Show>
              <Show when={self.isViewAddressBar}>
                <A.AddressBar class="text-xs flex items-center pr-0.5 h-5" style={{ "box-shadow": `#CCCABD 0px -1.25px 1px 0px inset` }}>
                  <div class="p-1.5 text-black/50 leading-[100%]">Address</div>
                  <A.ContextContainer class="border border-[#859CB6] bg-white relative flex h-full flex-1 items-center gap-1">
                    <img class="w-3.5 h-3.5" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAALCSURBVDhPdZNvSFNRGMZvOEOIogLLjYS+2BfrSyZtU8Iiw4piEZouLDOJJkmWhAPT/JOZYcxi6rbKTVEnohvOqc106p1py6XOv4my6azcaJioBAn1dKYXhjAfeHm4557fw8t7zqF8SSqt3Ftaqjyt1fRktLdbCg3vR2mdbmReqezHPZFCcJiK2sls3Sqj0ai1WseXTSYLTCYrmppoVKl7oGwZxDt6FqUdNlw6+7j1oB8v3GfI8PAoJKpmvDKMoHpkAcbVPzD/Beh1oGkZKP8GXL1YNMr2554PpKICGMyrrs7+j4qhn3hhAyqdgIZA+lVAS1zlAkrswLW4smkOixdPOtjFYF6p6wzP1RYnsqY2N8u+A28XN/3lHJBN1pPFBhebxUs5RPF2M5hXudlvYloGFiAaAjLHgdxpoGAGyCMungBSyXpiTt8yCRAHUuH7GMwrz2A0GgtiTcAtM3D3yybk8eTPQFwfcL1sASTgWTAVsZ/BtqpePdgfq13CBSMg6CVDI2Ee93xfbv+D1OKvJIAvCwrgHmCQrZLL6PIbaieO6wBuK8BvA9I711BcP4eM+83usBARzWHxS7YNKMxvS7hT8wMnm/8hh/6NWo0NaWkfEB1djRNHhDRpP4vjxz+17WVq0VlfS2TD0OtnUVtrRUWFmcDyjUpMkDqPBV8R+jwBj+rqPiUtLS1hfv4XVlZWiDtI0ARSUmohEMiRl9eKzIc1FrZ/RAg5sx0M5lVDQ99Tl8u1AbvdbthsdtD0FCSSDgiFchQUtCInq9FJZpDEoaL2MJhXottynsUyvuZwOGC3z2FycgZG4xhUqm4yhyoS1IWYyHQLx5+f7vMehFKhrHORD+KL8lVjWo1pXa83kwc1AIWiG+KMykX+0Zu9ZIjSbd+CR54fHD8el0z6EdlcQ0pHqoVUI5vFfRLkzzvDocKY9inqP+OethPzSizLAAAAAElFTkSuQmCC" alt="ie" />
                    <input
                      class="flex-1 h-full outline-none"
                      onChange={e => storeSelf.dir = e.currentTarget.value}
                      onKeyDown={async e => {
                        if (e.key != 'Enter') return
                        updateDirThenCurrentFiles({ dir: e.currentTarget.value })
                      }}
                      value={storeSelf.dir || "My Computer"}
                    />
                  </A.ContextContainer>
                  <A.GoButton onClick={async () => {
                    await API.folderRead({ dir: storeSelf.dir })
                  }} class="hover:brightness-110 hover:bg-[#F6F6F2] border-x border-black/0 hover:border-[#CECEC4] flex items-center h-full relative pr-1.5 mr-3.5 ml-0.5 pl-0.5">
                    <img class="h-[95%] mr-1 border border-white rounded-sm" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAJPSURBVDhPjZHbS9phHMZ/RVIUJZ1VLDErsJNGVHbCMpQOYlQSVBQdCIsCuxg127K20U3URazWgcpSy85mx0Eb7Krb3Y3tr/ksf7qLXW0feK/e7/M83/d5hdDPEDNPMzhuHfRf9mM/tdMR6KDN30b7UTsWnwXjgZG6/TrKt8rRrGhYflpGmH2aZe/7HivPK7i+uJj+PM3E3QRjN2OMXI8wcDVAz3kPtoCNpsMmdOs65LNyhMn7SVafV1n8tojz0YnjxsHQ1RB3v+4IYz2y0upvFUW1e7XoN/TkzuUiDAYHmfs6JyaNXo/Sd95H13GXKPpDxXYF+m09+i29mKiZ1yB0n3Yz9TDF+N04g5eD2E/sWH1WTB5TVBZBu6mleKuY0o1SNO4XYbiI0dAow8Fhes976TzupMXbgtFjpGq3KiqLULhdSNFmEWq3GsHsNdN30Re9+jcFOwXkLOQghJ3D6/4vqn0VsncyhMqdSvG/uk66RAPbiY3WwEuLJ00YzgzR8QjyCzkyr4y092kIJZ9KMB2YxNrD77UGrFgCFhrPGqPjERS3CjKCGUh9UpIWkxDy1vIw7Bpo9jbT4m/BfGTGdPx3o+p7NbIHGSmhFBJ8CUjcEgT5qpxwavVuNQ2eBuo99dQc1uD74RNF+cF8lCEl6TfpJF4mEueJI9YVi5D6IRXVioqitSJ0H3WUrZeJRtodLZp9DUqfkkx/Jsn+ZCQeCTFrMQhOAWHpcQmpU0rWqywUMwrxyF7LyHZlkz6fTvJCMonuROLfxhP75iVpWmDheoHfNvbnLyE6SFEAAAAASUVORK5CYII=" alt="go" />
                    <div>Go</div>
                  </A.GoButton>
                </A.AddressBar>
              </Show>
            </A.Toolbars>
            <A.MainContent class="border-l border-b border-l-[rgb(237,237,229)] flex-1 block text-[.75rem] overflow-y-auto bg-white" style={{}}>
              <MatchAs over={self.viewSidebarMx} match={{
                none: () => <></>,
                prompts: x => (
                  <A.ContentSidebar
                    class="overflow-auto [flex-basis:0] float-start w-1/4 max-w-56 min-w-48 p-2.5 space-y-3 sticky h-full top-0"
                    style={{ background: `linear-gradient(#82A0E0, #6674D0)` }}>
                    <Show when={storeSelf.dir}>
                      <XpAsideAccordion title="File and Folder Tasks">
                        <Show when={storeSelf.selectedItems.length} fallback={
                          <>
                            <XpAsideAccordionItem
                              icon="/src/assets/shell32/319.ico"
                              children="Make a new folder"
                              disabled
                              onClick={() => { }}
                            />
                          </>
                        }>
                          <XpAsideAccordionItem
                            icon="/src/assets/ico/856.ico"
                            onClick={handlers.openProperties}
                            children="Edit this contact"
                          />
                          <XpAsideAccordionItem
                            disabled
                            icon="/src/assets/ico/475.ico"
                            onClick={() => { }}
                            children="Move this contact"
                          />
                          <XpAsideAccordionItem
                            disabled
                            icon="/src/assets/ico/541.ico"
                            onClick={() => { }}
                            children="Copy this contact"
                          />
                          <XpAsideAccordionItem
                            disabled
                            icon="/src/assets/ico/848.ico"
                            onClick={() => { }}
                            children="Delete this contact"
                          />
                          <XpAsideAccordionItem
                            icon="/src/assets/ico/514.ico"
                            onClick={handlers.openInNotepad}
                            children="Open in text editor"
                          />
                        </Show>
                      </XpAsideAccordion>
                    </Show>
                    <XpAsideAccordion title="Details">
                      <div class="leading-3 text-[.62rem]">
                        {
                          !storeSelf.selectedItems.length ?
                            <>
                              <A.Title class="font-semibold">{"Address Book"}</A.Title>
                              <A.Type>{storeSelf.networkDirCurrentFiles.length} contacts</A.Type>
                              <A.Spacer class="h-0" />
                            </> :
                            storeSelf.selectedItems.length > 1 ?
                              <>
                                {storeSelf.selectedItems.length} items selected.
                              </> :
                              <>
                                <Variables item={storeSelf.networkDirCurrentFiles[storeSelf.selectedItems[0]]}>
                                  {props => (
                                    <>
                                      <A.Title class="font-semibold">{props.item.fullName}</A.Title>
                                      {props.item.photo && (
                                          <A.Type class="mt-1">
                                            <img src={`data:image/jpeg;base64,${props.item.photo}`} />
                                          </A.Type>
                                      )}
                                      {props.item.title && (
                                        <A.Type class="mt-1">
                                          Job Title: <br /> <span class="pl-2">{props.item.title}</span>
                                        </A.Type>
                                      )}
                                      {props.item.company && (
                                        <A.Type class="mt-1">
                                          Company: <br /> <span class="pl-2">{props.item.company}</span>
                                        </A.Type>
                                      )}
                                      {props.item.homeMobile && (
                                        <A.Type class="mt-1">
                                          Mobile Phone: <br /> <span class="pl-2">{props.item.homeMobile}</span>
                                        </A.Type>
                                      )}
                                      {props.item.email && (
                                        <A.Type class="mt-1">
                                          Preferred E-Mail: <br /> <span class="pl-2">{props.item.email}</span>
                                        </A.Type>
                                      )}
                                    </>
                                  )}
                                </Variables>
                              </>
                        }
                      </div>
                    </XpAsideAccordion>
                  </A.ContentSidebar>
                ),
                tree: x => (
                  <A.TreeSidebar class="float-start w-1/4 max-w-64 min-w-48 pr-1 sticky h-full flex flex-col top-0 bg-[linear-gradient(90deg,#F3F5F7,#EBE9DA)]">
                    <A.Title class="px-1 py-0.5 text-[.62rem] flex">
                      <span class="flex-1">
                        Folders
                      </span>
                      <A.Close
                        class="w-4 h-4 leading-[1.2rem] flex items-center justify-center hover:bg-white/30 rounded-sm border-black/30 hover:border"
                        onClick={() => self.viewSidebarMx = { as: "prompts" }}
                      >
                        x
                      </A.Close>
                    </A.Title>
                    <A.Inner class="bg-white pl-1.5 overflow-auto flex-1 [flex-basis:0] border-t border-[#ABA89B]">
                      <DirTree
                        path={`${storeSelf.dir}`}
                        dirTree={self.networkTreeDir}
                      />
                    </A.Inner>
                  </A.TreeSidebar>
                )
              }} />
              <Show
                when={storeSelf.networkDirCurrentFiles.length}
                fallback={
                  <div class="flex-1 bg-white outline-none overflow-x-auto  h-full resize-none">
                    <A.DiskDrives>
                      <A.BorderT class="border-t border-[#96abff]" />
                      <A.FileSection>
                        <A.FileSectionHeader class='font-bold pl-3'>Files Stored on This Computer</A.FileSectionHeader>
                        <A.FileSectionDivider class='h-0.5 bg-gradient-to-r from-[rgb(112,191,255)] to-white w-2/3 mb-4 ' />
                        <A.DiskDrive class='flex items-center' onDblClick={async () => {
                          updateDirThenCurrentFiles({ dir: "../data/" })
                        }}>
                          <img class='w-11 h-11 mr-1 ml-4' src="/src/assets/shell32/259.ico" />
                          <p class='tracking-tighter'>My Home Folder</p>
                        </A.DiskDrive>
                      </A.FileSection>
                      <A.SpaceY class="h-5" />
                      <A.FileSection>
                        <A.FileSectionHeader class='font-bold pl-3'>Hard Disk Drives</A.FileSectionHeader>
                        <A.FileSectionDivider class='h-0.5 bg-gradient-to-r from-[rgb(112,191,255)] to-white w-2/3 mb-4 ' />
                        <A.DiskDrive onDblClick={async () => {
                          updateDirThenCurrentFiles({ dir: "/" })
                        }} class='flex items-center'>
                          <img class='w-11 h-11 mr-1 ml-4' src="/src/assets/ico/73.ico" />
                          <p class='tracking-tighter'>Host Disk</p>
                        </A.DiskDrive>
                      </A.FileSection>
                    </A.DiskDrives>
                  </div>
                }
              >
                <XpFileFiosView />
              </Show>
            </A.MainContent>
            {self.isViewStatusBar && (
              <>
                <A.BorderY class="h-1 bg-[#EBE9DA]" />
                <A.StatusBar class="flex text-xs items-center pt-1 pb-0.5 bg-[#EBE9DA]" style={{ "box-shadow": `rgba(45, 45, 45, .4) 0 3px 3px -1px inset` }}>
                  <A.Details class="flex-1 pl-0.5">
                    {
                      !storeSelf.selectedItems.length ?
                        <>
                          {storeSelf.networkDirCurrentFiles.length} contacts in {storeSelf.dir}
                        </> :
                        storeSelf.selectedItems.length > 1 ?
                          <>
                            {storeSelf.selectedItems.length} contacts selected
                          </> :
                          <>
                            {storeSelf.networkDirCurrentFiles[storeSelf.selectedItems[0]].fullName}
                          </>
                    }
                  </A.Details>
                  <A.Border class="w-px h-full mx-2 border-l border-r border-l-[#C4C1B1] border-r-[#FFFFFF]" />
                  <A.Size class="w-24">
                    {storeSelf.selectedItems.length == 1 && humanFileSize(storeSelf.networkDirCurrentFiles[storeSelf.selectedItems[0]].size || 0)}
                  </A.Size>
                  <A.Border class="w-px h-full mx-2 border-l border-r border-l-[#C4C1B1] border-r-[#FFFFFF]" />
                  <A.Home class="w-24">
                    Address Book
                  </A.Home>
                </A.StatusBar>
              </>
            )}
          </XpWindow>
        )}
      </HandleSet>
    </A.FileExplorer>
  )

}

// https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
function humanFileSize(size: number) {
  const i = Math.floor(Math.log(size) / Math.log(1024))
  return `${(size / 1024 ** i).toFixed(2)} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`.replace(".00", "")
}
