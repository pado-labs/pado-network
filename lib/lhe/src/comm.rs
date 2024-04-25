use std::ffi::{CStr, CString};
use std::os::raw::c_char;

#[no_mangle]
#[export_name = "free_cptr"]
pub extern "C" fn __free_cptr(ptr: *mut c_char) {
    unsafe {
        // retake pointer to free memory
        let _ = CString::from_raw(ptr);
    }
}

pub fn cstr2string(cstr: *const c_char) -> String {
    let s;
    unsafe {
        s = CStr::from_ptr(cstr);
    }
    let s = s.to_bytes();
    let s = std::str::from_utf8(s).unwrap();
    s.to_string()
}
