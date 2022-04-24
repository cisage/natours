//data is an object containing the data and type is whether its user data or password
const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updatepassword'
        : '/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      alert('Data updated successfully');
      setTimeout(() => {
        location.reload();
      }, 1000);
    }
  } catch (err) {
    alert(err.response.data.message);
  }
};

const formUpdateData = document.querySelector('.form-user-data');
if (formUpdateData) {
  formUpdateData.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    //console.log(form);
    updateSettings(form, 'data');
  });
}

const formUpdatePassword = document.querySelector('.form-user-settings');
if (formUpdatePassword) {
  formUpdatePassword.addEventListener('submit', (e) => {
    e.preventDefault();
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    //console.log(passwordCurrent, password, passwordConfirm);
    updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');
  });
}
