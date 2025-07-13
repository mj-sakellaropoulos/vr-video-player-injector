function log(msg, module, obj){
    console.log(`[VR Video Injector${module ? ' / ' : ''}${module ? module : ''}] ${msg}`, obj ? obj : ' ');
}

function err(msg, module, obj){
    console.error(`[ERROR - VR Video Injector${module ? ' / ' : ''}${module ? module : ''}] ${msg}`, obj ? obj : ' ');
}

export { log }
export { err }