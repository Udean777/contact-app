const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const { body, validationResult, check } = require("express-validator");
const methodOverride = require("method-override");

require("./utils/db");
const Contact = require("./model/contact");

const app = express();
const port = 3000;

app.use(methodOverride("_method"));

app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

// ejs
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// home
app.get("/", (req, res) => {
  const mahasiswa = [
    {
      nama: "Jaka",
      email: "jaka@gmail.com",
    },
    {
      nama: "Roro",
      email: "roro@gmail.com",
    },
    {
      nama: "Budi",
      email: "budi@gmail.com",
    },
  ];
  res.render("index", {
    layout: "layouts/mainLayouts",
    nama: "Sajudin",
    title: "Home",
    mahasiswa,
  });
});

// about
app.get("/about", (req, res) => {
  res.render("about", { layout: "layouts/mainLayouts", title: "About" });
});

// contact
app.get("/contact", async (req, res) => {
  const contacts = await Contact.find();

  res.render("contact", {
    layout: "layouts/mainLayouts",
    title: "Contact",
    contacts,
    msg: req.flash("msg"),
  });
});

// tambah kontak
app.get("/contact/add", (req, res) => {
  res.render("addContact", {
    title: "Form Tambah Kontak",
    layout: "layouts/mainLayouts",
  });
});

// proses tambah data contact
app.post(
  "/contact",
  [
    body("nama").custom(async (value) => {
      const duplicate = await Contact.findOne({ nama: value });
      if (duplicate) {
        throw new Error("Nama kontak sudah digunakan");
      } else {
        return true;
      }
    }),
    check("email", "Email tidak valid!").isEmail(),
    check("nohp", "Nomor hp tidak valid!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("addContact", {
        title: "Form Tambah Kontak",
        layout: "layouts/mainLayouts",
        errors: errors.array(),
      });
    } else {
      Contact.insertMany(req.body)
        .then((result) => {
          req.flash(("msg", "Kontak berhasil ditambahkan"));
          res.redirect("/contact");
        })
        .catch((error) => {
          console.error(error);
          res.redirect("/contact/add");
        });
    }
  }
);

// delete
app.delete("/contact", (req, res) => {
  Contact.deleteOne({ nama: req.body.nama }).then((result) => {
    req.flash("msg", "Data contact berhasil dihapus");
    res.redirect("/contact");
  });
});

// edit
app.get("/contact/edit/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });
  res.render("editContact", {
    title: "Form Ubah Kontak",
    layout: "layouts/mainLayouts",
    contact,
  });
});

app.put(
  "/contact",
  [
    body("nama").custom(async (value, { req }) => {
      const duplicate = await Contact.findOne({ nama: value });
      if (value !== req.body.oldNama && duplicate) {
        throw new Error("Nama kontak sudah digunakan");
      } else {
        return true;
      }
    }),
    check("email", "Email tidak valid!").isEmail(),
    check("nohp", "Nomor hp tidak valid!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("editContact", {
        title: "Form Edit Kontak",
        layout: "layouts/mainLayouts",
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      Contact.updateOne(
        { _id: req.body._id },
        {
          $set: {
            nama: req.body.nama,
            email: req.body.email,
            nohp: req.body.nohp,
          },
        }
      ).then((result) => {
        req.flash("msg", "Kontak berhasil diubah");
        res.redirect("/contact");
      });
    }
  }
);

// detail
app.get("/contact/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });

  res.render("detail", {
    layout: "layouts/mainLayouts",
    title: "Detail",
    contact,
  });
});

app.listen(port, () => {
  console.log(`Mongo contact app | Listening at http://localhost:${port}`);
});
