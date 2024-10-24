
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"

import $ from "jquery"
if (process.env.NODE_ENV == "development") window.$ = $

const $login = $("#login")
const $signin = $("#signin")

function clearAllInput() {
    $("input").val("").removeClass("is-invalid")
    $(".invalid-feedback").hide()
}

$("input").on("input", function () {
    $(this).removeClass("is-invalid").nextAll(".invalid-feedback").hide()
})

$("#switch-to-signin").on("click", e => {
    e.preventDefault()

    $login.detach()
    $("#container").append($signin)
    clearAllInput()
})

$("#switch-to-login").on("click", e => {
    e.preventDefault()

    $signin.detach()
    $("#container").append($login)
    clearAllInput()
})

$("#login-btn").on("click", e => {
    e.preventDefault()

    const $usernameInput = $("#username")
    const $usernameInputFeedback = $usernameInput.nextAll(".invalid-feedback")
    const $passwordInput = $("#password")
    const $passwordInputFeedback = $passwordInput.nextAll(".invalid-feedback")

    const un = $usernameInput.val().toString()
    const pw = $passwordInput.val().toString()
    const lengthRange = [6, 12]
    const re = /^[a-zA-Z0-9]+$/

    let isUsernameError = true
    if (un == "") {
        $usernameInputFeedback.html("Không được để trống Username!")
    }
    else if (un.length < lengthRange[0] || un.length > lengthRange[1]) {
        $usernameInputFeedback.html(`Username phải có độ dài lớn hơn ${lengthRange[0]} và không vượt quá ${lengthRange[1]}!`)
    }
    else if (!re.test(un)) {
        $usernameInputFeedback.html(`Username chỉ được phép chứa các chữ cái a-z, A-Z và 0-9!`)
    }
    else {
        isUsernameError = false
    }

    let isPasswordError = true
    if (pw == "") {
        $passwordInputFeedback.html("Không được để trống Password!")
    }
    else if (pw.length < lengthRange[0] || pw.length > lengthRange[1]) {
        $passwordInputFeedback.html(`Password phải có độ dài lớn hơn ${lengthRange[0]} và không vượt quá ${lengthRange[1]}!`)
    }
    else if (!re.test(pw)) {
        $passwordInputFeedback.html(`Password chỉ được phép chứa các chữ cái a-z, A-Z và 0-9!`)
    }
    else {
        isPasswordError = false
    }

    let isUserInputValid = true
    
    if (isUsernameError) {
        isUserInputValid = false
        $usernameInput.addClass("is-invalid")
        $usernameInputFeedback.show()
    } else {
        $usernameInput.removeClass("is-invalid")
        $usernameInputFeedback.hide()
    }

    if (isPasswordError) {
        isUserInputValid = false
        $passwordInput.addClass("is-invalid")
        $passwordInputFeedback.show()
    } else {
        $passwordInput.removeClass("is-invalid")
        $passwordInputFeedback.hide()
    }

    if (!isUserInputValid) {
        return
    }



    // api.login({ username: un, password: pw }).then(({ message }) => {
    //     if (message == 'OK') {
    //         window.location.href = '.'
    //     } else if (message == 'WRONG_USERNAME_OR_PASSWORD') {
    //         $alert.show().html(`Username hoặc Password không chính xác!`)
    //     } else {
    //         $alert.show().html(`Có lỗi không xác định!`)
    //     }
    // }).catch((err) => {
    //     $alert.show().html(`Không thể kết nối tới server!`)
    // })
})

$("#signin-btn").on("click", e => {
    e.preventDefault()
})

$signin.detach()
$("#root").show()
