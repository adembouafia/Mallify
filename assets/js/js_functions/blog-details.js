// /**
//  * blog_details.js - Script pour gérer l'affichage des détails d'un blog et la gestion des commentaires
//  * Utilise XMLHttpRequest pour communiquer avec le backend
//  */

// // Configuration de base
// const API_BASE_URL = 'http://localhost:3000'; // Ajustez selon votre configuration

// // Fonction pour récupérer l'ID du blog depuis l'URL
// function getBlogIdFromUrl() {
//     const urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get('id');
// }

// // Fonction pour créer une requête XHR
// function createXHR(method, url, callback, data = null) {
//     const xhr = new XMLHttpRequest();
//     xhr.open(method, url, true);
//     xhr.setRequestHeader('Content-Type', 'application/json');
//     xhr.onreadystatechange = function() {
//         if (xhr.readyState === 4) {
//             if (xhr.status >= 200 && xhr.status < 300) {
//                 try {
//                     const response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
//                     callback(null, response);
//                 } catch (e) {
//                     callback(new Error(`Erreur de parsing JSON: ${e.message}`), null);
//                 }
//             } else {
//                 let errorMsg = `Erreur ${xhr.status}: ${xhr.statusText}`;
//                 try {
//                     if (xhr.responseText) {
//                         const errorResponse = JSON.parse(xhr.responseText);
//                         if (errorResponse && errorResponse.message) {
//                             errorMsg = `Erreur ${xhr.status}: ${errorResponse.message}`;
//                         }
//                     }
//                 } catch (parseError) {
//                     // Ignore parse error, stick with default message from statusText
//                 }
//                 callback(new Error(errorMsg), null);
//             }
//         }
//     };
//     xhr.onerror = function() {
//         callback(new Error('Erreur réseau'), null);
//     };
    
//     if (data) {
//         xhr.send(JSON.stringify(data));
//     } else {
//         xhr.send();
//     }
// }

// // Fonction pour charger les détails du blog
// function loadBlogDetails() {
//     const blogId = getBlogIdFromUrl();
    
//     if (!blogId) {
//         showError('ID du blog non trouvé dans l\'URL');
//         console.error('ID du blog non trouvé. URL actuelle:', window.location.href);
//         return;
//     }
    
//     // Utilisation de la route exacte /blog/:id
//     createXHR('GET', `${API_BASE_URL}/blog/${blogId}`, function(err, blog) {
//         if (err) {
//             showError('Impossible de charger les détails du blog');
//             console.error('Erreur lors du chargement du blog:', err);
//             return;
//         }
        
//         console.log('Blog chargé avec succès:', blog);
        
//         // Mettre à jour le contenu du blog
//         updateBlogContent(blog);
        
//         // Charger les commentaires
//         loadComments(blog);
//     });
// }

// // Fonction pour mettre à jour le contenu du blog dans le DOM
// function updateBlogContent(blog) {
//     // Mettre à jour le titre
//     const titleElement = document.querySelector('.blog-item__content h4');
//     if (titleElement) {
//         titleElement.textContent = blog.title;
//     }
    
//     // Mettre à jour la description/contenu
//     const paragraphs = document.querySelectorAll('.blog-item__content p');
//     if (paragraphs.length >= 1) {
//         paragraphs[0].textContent = blog.description;
//     }
//     if (paragraphs.length >= 2) {
//         paragraphs[1].textContent = blog.content;
//     }
    
//     // Mettre à jour la catégorie
//     const categorySpan = document.querySelector('.blog-item__content span.bg-main-50');
//     if (categorySpan) {
//         categorySpan.textContent = blog.category;
//     }
    
//     // Mettre à jour la date
//     const dateElement = document.querySelector('.flex-align.flex-wrap.gap-24 .text-sm.text-gray-500 a');
//     if (dateElement) {
//         const date = new Date(blog.createdAt);
//         dateElement.textContent = date.toLocaleDateString('fr-FR', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric'
//         });
//     }
    
//     // Mettre à jour le nombre de commentaires
//     const commentsCountElements = document.querySelectorAll('.flex-align.flex-wrap.gap-24 .text-sm.text-gray-500 a');
//     if (commentsCountElements.length > 1) {
//         const commentsCount = blog.comments ? blog.comments.length : 0;
//         commentsCountElements[1].textContent = `${commentsCount} Commentaire${commentsCount > 1 ? 's' : ''}`;
//     }
    
//     // Mettre à jour les images
//     updateBlogImages(blog);
    
//     // Mettre à jour les tags
//     updateBlogTags(blog);
// }

// // Fonction pour mettre à jour les images du blog
// function updateBlogImages(blog) {
//     // Image principale
//     const mainImageUrl = blog.mainImageBlog.startsWith('http') 
//         ? blog.mainImageBlog 
//         : `${API_BASE_URL}/${blog.mainImageBlog}`;
    
//     // Mettre à jour l'image principale dans le slider
//     const mainSliderItems = document.querySelectorAll('.slider-for__item img');
//     if (mainSliderItems.length > 0) {
//         mainSliderItems[0].src = mainImageUrl;
//         mainSliderItems[0].alt = blog.title;
//     }
    
//     // Mettre à jour les images supplémentaires si elles existent
//     if (blog.otherImagesBlog && blog.otherImagesBlog.length > 0) {
//         // Ajouter les images supplémentaires au slider principal
//         for (let i = 1; i < Math.min(mainSliderItems.length, blog.otherImagesBlog.length + 1); i++) {
//             const imageUrl = blog.otherImagesBlog[i-1].startsWith('http') 
//                 ? blog.otherImagesBlog[i-1] 
//                 : `${API_BASE_URL}/${blog.otherImagesBlog[i-1]}`;
            
//             mainSliderItems[i].src = imageUrl;
//             mainSliderItems[i].alt = `${blog.title} - Image ${i}`;
//         }
        
//         // Mettre à jour les miniatures
//         const navSliderItems = document.querySelectorAll('.slider-nav__item img');
//         if (navSliderItems.length > 0) {
//             navSliderItems[0].src = mainImageUrl;
//             navSliderItems[0].alt = blog.title;
            
//             for (let i = 1; i < Math.min(navSliderItems.length, blog.otherImagesBlog.length + 1); i++) {
//                 const imageUrl = blog.otherImagesBlog[i-1].startsWith('http') 
//                     ? blog.otherImagesBlog[i-1] 
//                     : `${API_BASE_URL}/${blog.otherImagesBlog[i-1]}`;
                
//                 navSliderItems[i].src = imageUrl;
//                 navSliderItems[i].alt = `${blog.title} - Miniature ${i}`;
//             }
//         }
//     }
// }

// // Fonction pour mettre à jour les tags du blog
// function updateBlogTags(blog) {
//     if (!blog.tags || blog.tags.length === 0) return;
    
//     const tagsContainer = document.querySelector('.mt-48 .flex-align.gap-8');
//     if (!tagsContainer) return;
    
//     // Supprimer tous les tags existants sauf le titre "Tag:"
//     while (tagsContainer.children.length > 1) {
//         tagsContainer.removeChild(tagsContainer.lastChild);
//     }
    
//     // Ajouter les nouveaux tags
//     blog.tags.forEach(tag => {
//         const tagLink = document.createElement('a');
//         tagLink.href = `blog.html?tag=${encodeURIComponent(tag)}`;
//         tagLink.className = 'border border-gray-100 rounded-4 py-6 px-8 hover-bg-gray-100 text-gray-900';
//         tagLink.textContent = tag;
//         tagsContainer.appendChild(tagLink);
//     });
// }

// // Fonction pour charger les commentaires
// function loadComments(blog) {
//     // Trouver le conteneur des commentaires
//     const commentsContainer = document.querySelector('form h6.mb-48');
//     if (!commentsContainer) {
//         console.warn("Titre des commentaires non trouvé");
//         return;
//     }
    
//     // Mettre à jour le titre des commentaires
//     commentsContainer.textContent = "Commentaires";
    
//     // Trouver le parent du conteneur des commentaires (le formulaire)
//     const formContainer = commentsContainer.closest('form');
//     if (!formContainer) {
//         console.warn("Formulaire des commentaires non trouvé");
//         return;
//     }
    
//     // Supprimer tous les commentaires statiques existants
//     const existingComments = formContainer.querySelectorAll('.d-flex.align-items-start.gap-16');
//     existingComments.forEach(comment => {
//         comment.remove();
//     });
    
//     // Trouver le bouton "Load More" s'il existe
//     const loadMoreButton = formContainer.querySelector('.mt-48 button');
    
//     // Gérer le bouton "Load More" en fonction du nombre de commentaires
//     if (loadMoreButton) {
//         const commentsCount = blog.comments ? blog.comments.length : 0;
        
//         if (commentsCount < 5) {
//             // Cacher le bouton si moins de 5 commentaires
//             loadMoreButton.style.display = 'none';
//         } else {
//             // Afficher et activer le bouton si 5 commentaires ou plus
//             loadMoreButton.style.display = ''; // Réinitialise à la valeur CSS par défaut (block, inline-block, etc.)
//             loadMoreButton.disabled = false;
//             loadMoreButton.classList.remove('disabled');
//             loadMoreButton.style.opacity = '1';
//             loadMoreButton.style.cursor = 'pointer';
//         }
//     }
    
//     // Si pas de commentaires, afficher un message
//     if (!blog.comments || blog.comments.length === 0) {
//         const noCommentsMessage = document.createElement('p');
//         noCommentsMessage.className = 'text-gray-500 mt-16';
//         noCommentsMessage.textContent = 'Aucun commentaire pour le moment. Soyez le premier à commenter !';
        
//         const loadMoreContainer = formContainer.querySelector('.mt-48');
//         if (loadMoreContainer) {
//             formContainer.insertBefore(noCommentsMessage, loadMoreContainer);
//         } else {
//             formContainer.appendChild(noCommentsMessage);
//         }
//         return;
//     }
    
//     // Ajouter les commentaires dynamiquement
//     blog.comments.forEach(comment => {
//         const commentElement = createCommentElement(comment);
        
//         const loadMoreContainer = formContainer.querySelector('.mt-48');
//         if (loadMoreContainer) {
//             formContainer.insertBefore(commentElement, loadMoreContainer);
//         } else {
//             formContainer.appendChild(commentElement);
//         }
//     });
// }

// // Fonction pour créer un élément de commentaire
// function createCommentElement(comment) {
//     const commentDiv = document.createElement('div');
//     commentDiv.className = 'd-flex align-items-start gap-16 mb-32 pb-32 border-bottom border-gray-100';
//     commentDiv.dataset.commentId = comment._id;
    
//     // Créer l'avatar (image par défaut)
//     const avatar = document.createElement('img');
//     avatar.src = '../assets/images/team_members/devoloper1.jpg'; // Image par défaut
//     avatar.alt = comment.name;
//     avatar.className = 'w-40 h-40 rounded-circle object-fit-cover flex-shrink-0';
    
//     // Créer le contenu du commentaire
//     const contentDiv = document.createElement('div');
//     contentDiv.className = 'flex-grow-1';
    
//     // En-tête du commentaire (nom et date)
//     const headerDiv = document.createElement('div');
//     headerDiv.className = 'flex-align gap-8';
    
//     const nameHeading = document.createElement('h6');
//     nameHeading.className = 'text-md fw-bold mb-0';
//     nameHeading.textContent = comment.name;
    
//     const separator = document.createElement('span');
//     separator.className = 'w-6 h-6 bg-gray-500 rounded-circle';
    
//     const dateSpan = document.createElement('span');
//     dateSpan.className = 'text-sm fw-medium text-gray-700';
//     const commentDate = new Date(comment.date);
//     dateSpan.textContent = commentDate.toLocaleDateString('fr-FR', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//     });
    
//     headerDiv.appendChild(nameHeading);
//     headerDiv.appendChild(separator);
//     headerDiv.appendChild(dateSpan);
    
//     // Texte du commentaire
//     const commentText = document.createElement('p');
//     commentText.className = 'mt-16 text-gray-700';
//     commentText.textContent = comment.comment;
    
//     contentDiv.appendChild(headerDiv);
//     contentDiv.appendChild(commentText);
    
//     // Assembler le commentaire
//     commentDiv.appendChild(avatar);
//     commentDiv.appendChild(contentDiv);
    
//     return commentDiv;
// }

// // Fonction pour configurer le formulaire d'ajout de commentaire
// function setupCommentForm() {
//     // Trouver le formulaire d'ajout de commentaire
//     const commentFormContainer = document.querySelector('.my-48 form');
//     if (!commentFormContainer) {
//         console.warn("Formulaire d'ajout de commentaire non trouvé");
//         return;
//     }
    
//     // Supprimer l'attribut action pour éviter la soumission par défaut
//     commentFormContainer.removeAttribute('action');
    
//     // Ajouter un gestionnaire d'événement pour la soumission du formulaire
//     commentFormContainer.addEventListener('submit', function(event) {
//         event.preventDefault();
        
//         const nameInput = document.getElementById('name');
//         const emailInput = document.getElementById('email');
//         const messageInput = document.getElementById('message');
        
//         // Validation simple
//         if (!nameInput.value.trim()) {
//             showError('Veuillez entrer votre nom');
//             nameInput.focus();
//             return;
//         }
        
//         if (!emailInput.value.trim()) {
//             showError('Veuillez entrer votre email');
//             emailInput.focus();
//             return;
//         }
        
//         if (!validateEmail(emailInput.value.trim())) {
//             showError('Veuillez entrer un email valide');
//             emailInput.focus();
//             return;
//         }
        
//         if (!messageInput.value.trim()) {
//             showError('Veuillez entrer votre commentaire');
//             messageInput.focus();
//             return;
//         }
        
//         const blogId = getBlogIdFromUrl();
//         if (!blogId) {
//             showError('ID du blog non trouvé dans l\'URL');
//             return;
//         }
        
//         // Préparer les données du commentaire
//         const commentData = {
//             name: nameInput.value.trim(),
//             email: emailInput.value.trim(),
//             comment: messageInput.value.trim()
//         };
        
//         // Désactiver le bouton de soumission pendant l'envoi
//         const submitButton = commentFormContainer.querySelector('button[type="submit"]');
//         if (submitButton) {
//             submitButton.disabled = true;
//             submitButton.textContent = 'Envoi en cours...';
//         }
        
//         // Envoyer le commentaire au serveur
//         createXHR('POST', `${API_BASE_URL}/blog/${blogId}/comment`, function(err, response) {
//             // Réactiver le bouton de soumission
//             if (submitButton) {
//                 submitButton.disabled = false;
//                 submitButton.textContent = 'Post Comment';
//             }
            
//             if (err) {
//                 showError('Erreur lors de l\'envoi du commentaire: ' + err.message);
//                 return;
//             }
            
//             // Réinitialiser le formulaire
//             commentFormContainer.reset();
            
//             // Afficher un message de succès
//             showSuccess('Votre commentaire a été ajouté avec succès!');
            
//             // Recharger la page pour afficher le nouveau commentaire
//             setTimeout(function() {
//                 window.location.reload();
//             }, 1500);
//         }, commentData);
//     });
    
//     // Configurer le bouton "Load More"
//     setupLoadMoreButton();
// }

// // Fonction pour configurer le bouton "Load More"
// function setupLoadMoreButton() {
//     const loadMoreButton = document.querySelector('.mt-48 button');
//     if (!loadMoreButton) {
//         console.warn("Bouton 'Load More' non trouvé");
//         return;
//     }
    
//     loadMoreButton.addEventListener('click', function(event) {
//         event.preventDefault();
        
//         // Si le bouton est désactivé, ne rien faire
//         if (loadMoreButton.disabled) {
//             return;
//         }
        
//         const blogId = getBlogIdFromUrl();
//         if (!blogId) {
//             showError('ID du blog non trouvé dans l\'URL');
//             return;
//         }
        
//         // Changer le texte du bouton pendant le chargement
//         const originalText = loadMoreButton.textContent;
//         loadMoreButton.textContent = 'Chargement...';
//         loadMoreButton.disabled = true;
        
//         // Ici, vous pourriez implémenter une pagination réelle en appelant une API
//         // Pour l'instant, nous simulons juste un chargement
//         setTimeout(function() {
//             // Restaurer le bouton
//             loadMoreButton.textContent = originalText;
//             loadMoreButton.disabled = true;
//             loadMoreButton.classList.add('disabled');
//             loadMoreButton.style.opacity = '0.5';
//             loadMoreButton.style.cursor = 'not-allowed';
            
//             // Afficher un message indiquant qu'il n'y a plus de commentaires à charger
//             showInfo('Tous les commentaires ont été chargés');
//         }, 1000);
//     });
// }

// // Fonction pour valider un email
// function validateEmail(email) {
//     const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//     return re.test(email);
// }

// // Fonction pour afficher une erreur
// function showError(message) {
//     console.error(message);
//     Swal.fire({
//         icon: 'error',
//         title: 'Erreur',
//         text: message,
//         confirmButtonColor: '#3085d6'
//     });
// }

// // Fonction pour afficher un succès
// function showSuccess(message) {
//     console.log(message);
//     Swal.fire({
//         icon: 'success',
//         title: 'Succès',
//         text: message,
//         confirmButtonColor: '#3085d6'
//     });
// }

// // Fonction pour afficher une information
// function showInfo(message) {
//     console.log(message);
//     Swal.fire({
//         icon: 'info',
//         title: 'Information',
//         text: message,
//         confirmButtonColor: '#3085d6'
//     });
// }

// // Initialisation
// document.addEventListener('DOMContentLoaded', function() {
//     console.log('Initialisation de blog_details.js');
    
//     // Récupérer l'ID du blog depuis l'URL
//     const blogId = getBlogIdFromUrl();
    
//     if (blogId) {
//         console.log('ID du blog trouvé dans l\'URL:', blogId);
        
//         // Charger les détails du blog
//         loadBlogDetails();
        
//         // Configurer le formulaire de commentaire
//         setupCommentForm();
//     } else {
//         showError('ID du blog non trouvé dans l\'URL. Veuillez vérifier que l\'URL contient un paramètre "id".');
//     }
// });