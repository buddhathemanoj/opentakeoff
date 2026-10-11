const {app,BrowserWindow,dialog,shell,session,Menu}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
let mainWindow,localServer;
app.setName('Arcloom');
// Preserve the existing local profile during the product rename.
app.setPath('userData',path.join(app.getPath('appData'),'Kosal Studio'));
if(!app.requestSingleInstanceLock())app.quit();
else {
  app.on('second-instance',()=>{if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.focus();}});
  app.whenReady().then(async()=>{
    try {
      const {startStudioServer}=await import(pathToFileURL(path.join(app.getAppPath(),'studio/server.mjs')).href);
      const running=await startStudioServer({root:path.join(app.getAppPath(),'web/dist')});localServer=running.server;
      Menu.setApplicationMenu(Menu.buildFromTemplate([{role:'appMenu'},{role:'editMenu'},{role:'viewMenu'},{role:'windowMenu'}]));
      session.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
      const createWindow=()=>{
        mainWindow=new BrowserWindow({width:1480,height:940,minWidth:980,minHeight:680,title:'Arcloom',backgroundColor:'#191919',titleBarStyle:process.platform==='darwin'?'hiddenInset':'default',trafficLightPosition:{x:18,y:22},show:false,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
        mainWindow.setMenuBarVisibility(false);
        mainWindow.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//.test(url))shell.openExternal(url);return {action:'deny'};});
        mainWindow.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==running.url){event.preventDefault();if(/^https:\/\//.test(url))shell.openExternal(url);}});
        mainWindow.once('ready-to-show',()=>mainWindow.show());
        mainWindow.loadURL(running.url);
        mainWindow.webContents.on('did-finish-load',()=>{if(process.platform==='darwin')mainWindow.webContents.insertCSS('.ks-sidebar-brand{-webkit-app-region:drag}');});
        mainWindow.on('closed',()=>{mainWindow=null;});
      };
      createWindow();
      app.on('activate',()=>{if(!mainWindow)createWindow();});
    }catch(error){dialog.showErrorBox('Arcloom could not start',error.code==='EADDRINUSE'?'Port 51377 is already in use. Close the other Arcloom instance and try again.':error.message);app.quit();}
  });
  app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
  app.on('before-quit',()=>localServer?.close());
}
