use std::ffi::CString;
use std::os::raw::c_char;

#[no_mangle]
#[export_name = "keygen"]
pub extern "C" fn __keygen(_c_param: *const c_char) -> *const c_char {
    CString::new("{}".to_string()).unwrap().into_raw()
}
#[no_mangle]
#[export_name = "encrypt"]
pub extern "C" fn __encrypt(_c_param: *const c_char) -> *const c_char {
    CString::new("{}".to_string()).unwrap().into_raw()
}

#[no_mangle]
#[export_name = "reencrypt"]
pub extern "C" fn __reencrypt(_c_param: *const c_char) -> *const c_char {
    CString::new("{}".to_string()).unwrap().into_raw()
}

#[no_mangle]
#[export_name = "decrypt"]
pub extern "C" fn __decrypt(_c_param: *const c_char) -> *const c_char {
    CString::new("{}".to_string()).unwrap().into_raw()
}

pub fn main() {
    println!("initialize ok");
}
